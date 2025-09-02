
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");

// INICIALIZAR FIREBASE ADMIN
admin.initializeApp();

// Función para migrar un documento y sus subcolecciones de forma recursiva.
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

    const prices = {
        esencial: 22620, 
        pro: 34220,      
        ilimitado: 69020 
    };

    const unitAmount = prices[planId];
    if (!unitAmount) {
        throw new functions.https.HttpsError("invalid-argument", `El plan seleccionado '${planId}' no es válido.`);
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
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
                            name: `Plan ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
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
    
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        console.error(`Error en la firma del webhook: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { restaurantId, planId } = session.metadata;
        
        try {
            const demoRef = admin.firestore().collection("restaurantes_demo").doc(restaurantId);
            const mainRef = admin.firestore().collection("restaurantes").doc(restaurantId);

            await migrateDocument(demoRef, mainRef);
            
            await mainRef.update({
                plan: planId,
                stripeSubscriptionId: session.subscription,
                stripeCustomerId: session.customer, // <-- GUARDAR CUSTOMER ID
                subscriptionStatus: "active",
                subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
            });

            const billingRef = mainRef.collection("billing");
            await billingRef.add({
                paymentDate: admin.firestore.FieldValue.serverTimestamp(),
                plan: planId,
                amount: session.amount_total / 100,
                currency: session.currency,
                invoiceId: session.invoice, 
                status: session.payment_status,
            });

            const usersQuery = admin.firestore().collection("usuarios").where("restauranteId", "==", restaurantId);
            const usersSnapshot = await usersQuery.get();
            const batch = admin.firestore().batch();
            usersSnapshot.forEach(doc => {
                batch.update(doc.ref, { plan: planId });
            });
            await batch.commit();

            await admin.firestore().recursiveDelete(demoRef);

            console.log(`Migración y guardado de customerId completados para ${restaurantId}`);

        } catch (error) {
            console.error("Error al procesar el pago y la migración:", error);
            res.status(500).send("Error interno al procesar el webhook.");
            return;
        }
    }

    res.status(200).send();
});


// NUEVA FUNCIÓN PARA CREAR EL PORTAL DE CLIENTE
exports.createCustomerPortalSession = onCall({
    invoker: 'public',
    secrets: ["STRIPE_SECRET_KEY", "APP_URL"],
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes estar autenticado.");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { restaurantId } = request.data;
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    try {
        const usersQuery = admin.firestore().collection("usuarios").where("uid", "==", request.auth.uid);
        const userSnapshot = await usersQuery.get();

        if(userSnapshot.empty) {
            throw new functions.https.HttpsError("not-found", "No se encontró el usuario.");
        }
        const userData = userSnapshot.docs[0].data();
        const userPlan = userData.plan;
        
        const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
        const restaurantDoc = await admin.firestore().collection(collectionName).doc(restaurantId).get();

        if (!restaurantDoc.exists) {
            throw new functions.https.HttpsError("not-found", "No se encontró el restaurante.");
        }

        const stripeCustomerId = restaurantDoc.data().stripeCustomerId;

        if (!stripeCustomerId) {
            throw new functions.https.HttpsError("failed-precondition", "El cliente no tiene una suscripción de Stripe.");
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${appUrl}/dashboard-admin/billing`,
        });

        return { url: session.url };

    } catch (error) {
        console.error("Error al crear la sesión del portal de cliente:", error);
        throw new functions.https.HttpsError("internal", "No se pudo crear la sesión del portal de cliente.");
    }
});
