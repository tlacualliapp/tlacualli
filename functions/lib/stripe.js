
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");

admin.initializeApp();

async function migrateDocument(sourceDocRef, destinationDocRef) {
    const docSnapshot = await sourceDocRef.get();
    if (!docSnapshot.exists) {
        console.log(`El documento ${sourceDocRef.path} no existe, no se migra.`);
        return;
    }
    await destinationDocRef.set(docSnapshot.data());

    const subcollections = await sourceDocRef.listCollections();
    for (const subcollectionRef of subcollections) {
        const querySnapshot = await subcollectionRef.get();
        for (const doc of querySnapshot.docs) {
            await migrateDocument(doc.ref, destinationDocRef.collection(subcollectionRef.id).doc(doc.id));
        }
    }
}

exports.createStripeCheckout = onCall({ 
    invoker: 'public',
    secrets: ["STRIPE_SECRET_KEY", "APP_URL"],
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes estar autenticado para realizar un pago.");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { planId, restaurantId } = request.data;

    const planDoc = await admin.firestore().collection('planes').doc(planId).get();
    if (!planDoc.exists) {
        throw new functions.https.HttpsError("not-found", `El plan con ID '${planId}' no fue encontrado.`);
    }

    const planData = planDoc.data();
    const priceFromDb = planData.price;
    const planName = planData.name;

    if (typeof priceFromDb !== 'number' || priceFromDb <= 0) {
        throw new functions.https.HttpsError("invalid-argument", `El plan no tiene un precio válido.`);
    }
    
    const unitAmount = Math.round(priceFromDb * 100);

    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, '');
    const successUrl = `${appUrl}/dashboard-admin/billing?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/dashboard-admin/upgrade`;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price_data: {
                        currency: "mxn",
                        product_data: {
                            name: `Plan ${planName}`,
                        },
                        unit_amount: unitAmount,
                        recurring: { interval: "month" },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: request.auth.uid,
                restaurantId: restaurantId,
                planId: planId,
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return { sessionId: session.id };
    } catch (error) {
        console.error("Error al crear la sesión de Stripe:", error);
        throw new functions.https.HttpsError("internal", "No se pudo crear la sesión de pago.");
    }
});


exports.stripeWebhook = onRequest({ 
    invoker: 'public',
    secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
}, async (req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, req.headers["stripe-signature"], webhookSecret);
    } catch (err) {
        console.error(`Error en la firma del webhook: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    
    const updateSubscriptionStatus = async (customerId, status) => {
        const restaurantsQuery = admin.firestore().collection('restaurantes').where('stripeCustomerId', '==', customerId);
        const snapshot = await restaurantsQuery.get();
        if (!snapshot.empty) {
            const restaurantId = snapshot.docs[0].id;
            await admin.firestore().collection('restaurantes').doc(restaurantId).update({ subscriptionStatus: status });
        } 
    };

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { restaurantId, planId } = session.metadata;
        
        try {
            const planDoc = await admin.firestore().collection('planes').doc(planId).get();
            if (!planDoc.exists) throw new Error(`Plan con ID ${planId} no encontrado.`);
            const planName = planDoc.data().name.toLowerCase();

            const demoRef = admin.firestore().collection("restaurantes_demo").doc(restaurantId);
            const mainRef = admin.firestore().collection("restaurantes").doc(restaurantId);
            const demoSnapshot = await demoRef.get();

            if (demoSnapshot.exists) {
                await migrateDocument(demoRef, mainRef);
                await mainRef.update({
                    plan: planName,
                    stripeSubscriptionId: session.subscription,
                    stripeCustomerId: session.customer,
                    subscriptionStatus: "active",
                    subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
                });
                await admin.firestore().recursiveDelete(demoRef);
            } else {
                await mainRef.update({
                    plan: planName, 
                    subscriptionStatus: "active",
                    stripeSubscriptionId: session.subscription,
                });
            }
            
            const billingRef = mainRef.collection("billing");
            await billingRef.add({
                paymentDate: admin.firestore.FieldValue.serverTimestamp(),
                plan: planName,
                amount: session.amount_total / 100,
                currency: session.currency,
                invoiceId: session.invoice, 
                status: 'paid',
                description: demoSnapshot.exists ? 'Pago inicial de suscripción' : `Cambio de plan a ${planName}`
            });

            const usersQuery = admin.firestore().collection("usuarios").where("restauranteId", "==", restaurantId);
            const usersSnapshot = await usersQuery.get();
            const batch = admin.firestore().batch();
            usersSnapshot.forEach(doc => {
                batch.update(doc.ref, { plan: planName });
            });
            await batch.commit();

        } catch (error) {
            console.error("Error al procesar el pago y la actualización:", error);
            res.status(500).send("Error interno al procesar el webhook.");
            return;
        }
    } else if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        try {
            const restaurantsQuery = admin.firestore().collection('restaurantes').where('stripeCustomerId', '==', customerId);
            const snapshot = await restaurantsQuery.get();
            if (!snapshot.empty) {
                const restaurantDoc = snapshot.docs[0];
                await restaurantDoc.ref.update({ subscriptionStatus: 'active' });
                const billingRef = restaurantDoc.ref.collection("billing");
                await billingRef.add({
                    paymentDate: admin.firestore.FieldValue.serverTimestamp(),
                    plan: restaurantDoc.data().plan,
                    amount: invoice.amount_paid / 100,
                    currency: invoice.currency,
                    invoiceId: invoice.id,
                    status: 'paid',
                    description: 'Pago recurrente de suscripción'
                });
            }
        } catch (error) {
            console.error("Error al registrar pago recurrente:", error);
        }

    } else if (event.type === 'invoice.payment_failed' || event.type === 'customer.subscription.deleted') {
         const object = event.data.object;
         const customerId = object.customer;
         await updateSubscriptionStatus(customerId, 'inactive');
    }

    res.status(200).send();
});


exports.createCustomerPortalSession = onCall({
    invoker: 'public',
    secrets: ["STRIPE_SECRET_KEY", "APP_URL"],
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes estar autenticado.");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { restaurantId } = request.data;
    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, '');

    try {
        const restaurantRef = admin.firestore().collection('restaurantes').doc(restaurantId);
        const restaurantDoc = await restaurantRef.get();

        if (!restaurantDoc.exists) {
            console.error(`Restaurante con ID ${restaurantId} no encontrado.`);
            throw new functions.https.HttpsError("not-found", "No se encontró el restaurante asociado a la suscripción.");
        }

        let stripeCustomerId = restaurantDoc.data().stripeCustomerId;
        const restaurantEmail = restaurantDoc.data().email;

        // Lógica de autoreparación: si no hay ID, buscarlo en Stripe por email
        if (!stripeCustomerId && restaurantEmail) {
            console.log(`stripeCustomerId no encontrado para ${restaurantId}. Buscando en Stripe por email...`);
            try {
                const customers = await stripe.customers.list({ email: restaurantEmail, limit: 1 });
                if (customers.data.length > 0) {
                    stripeCustomerId = customers.data[0].id;
                    console.log(`Cliente de Stripe encontrado: ${stripeCustomerId}. Actualizando la base de datos.`);
                    await restaurantRef.update({ stripeCustomerId: stripeCustomerId });
                } else {
                    console.error(`Ningún cliente de Stripe encontrado con el email: ${restaurantEmail}`);
                    throw new functions.https.HttpsError("not-found", "No se encontró información de cliente en el sistema de pagos.");
                }
            } catch (stripeError) {
                console.error("Error al buscar cliente en Stripe:", stripeError);
                throw new functions.https.HttpsError("internal", "Ocurrió un error al verificar la información de pago.");
            }
        }

        if (!stripeCustomerId) {
            console.error(`stripeCustomerId sigue sin encontrarse para ${restaurantId} después de la búsqueda.`);
            throw new functions.https.HttpsError("failed-precondition", "Este cliente no tiene una suscripción de Stripe activa para administrar.");
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${appUrl}/dashboard-admin/billing`,
        });

        return { url: session.url };

    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            console.error(`Error al crear la sesión del portal de cliente para ${restaurantId}: ${error.message}`);
            throw error; 
        } else {
            console.error(`Error genérico al crear la sesión del portal de cliente para ${restaurantId}:`, error);
            throw new functions.https.HttpsError("internal", "No se pudo crear la sesión del portal de cliente. Intenta de nuevo más tarde.");
        }
    }
});
