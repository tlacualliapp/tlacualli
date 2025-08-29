"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.createStripeCheckout = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const priceIds = {
    "esencial": "price_1PMEhsP8w7P9v3s03e72G3vS",
    "pro": "price_1PMEjGP8w7P9v3s0YxPpwW2B",
    "ilimitado": "price_1PMEkdP8w7P9v3s0XyYqRzXB",
};
exports.createStripeCheckout = functions.https.onCall(async (request) => {
    const { data, auth } = request;
    // Se inicializa Stripe dentro de la función
    const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
        apiVersion: "2025-08-27.basil",
    });
    if (!auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { planId, restaurantId } = data;
    const uid = auth.uid;
    if (!planId || !restaurantId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with planId and restaurantId.");
    }
    const priceId = priceIds[planId];
    if (!priceId) {
        throw new functions.https.HttpsError("not-found", `Price ID for plan "${planId}" not found.`);
    }
    try {
        const user = await admin.auth().getUser(uid);
        const db = admin.firestore();
        const userColl = db.collection("usuarios").where("uid", "==", uid);
        const userSnapshot = await userColl.get();
        if (userSnapshot.empty) {
            throw new functions.https.HttpsError("not-found", "User not found in Firestore.");
        }
        const userData = userSnapshot.docs[0].data();
        let stripeCustomerId = userData.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.displayName,
                metadata: { firebaseUID: uid, restaurantId: restaurantId },
            });
            stripeCustomerId = customer.id;
            await userSnapshot.docs[0].ref.update({ stripeCustomerId });
        }
        const appUrl = functions.config().app.url;
        const successUrl = `${appUrl}/dashboard-admin/billing?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${appUrl}/dashboard-admin/upgrade`;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            customer: stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: "subscription",
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                firebaseUID: uid,
                restaurantId,
                planId,
                isDemo: userData.plan === "demo" ? "true" : "false",
            },
        });
        return { sessionId: session.id };
    }
    catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw new functions.https.HttpsError("internal", "An error occurred creating the checkout session.");
    }
});
const handleCheckoutCompleted = async (session) => {
    const { restaurantId, planId, isDemo } = session.metadata || {};
    const subId = session.subscription;
    const subscriptionId = typeof subId === "string" ? subId : subId === null || subId === void 0 ? void 0 : subId.id;
    if (!restaurantId || !planId || !subscriptionId) {
        console.error("Missing metadata from session:", session.id);
        return;
    }
    const db = admin.firestore();
    const fromCollection = isDemo === "true" ?
        "restaurantes_demo" :
        "restaurantes";
    const fromRef = db.collection(fromCollection).doc(restaurantId);
    const fromSnap = await fromRef.get();
    if (!fromSnap.exists) {
        console.error(`Restaurant ${restaurantId} not found in ${fromCollection}`);
        return;
    }
    if (isDemo === "true") {
        const restaurantData = fromSnap.data();
        if (restaurantData) {
            await db.collection("restaurantes").doc(restaurantId).set(restaurantData);
            await fromRef.delete();
            console.log(`Moved restaurant ${restaurantId} from demo to main.`);
        }
    }
    const mainRestaurantRef = db.collection("restaurantes").doc(restaurantId);
    await mainRestaurantRef.update({
        plan: planId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
    });
    console.log(`Upgraded restaurant ${restaurantId} to plan ${planId}.`);
};
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    // Se inicializa Stripe dentro de la función
    const stripe = new stripe_1.default(functions.config().stripe.webhook_secret, {
        apiVersion: "2025-08-27.basil",
    });
    const signature = req.headers["stripe-signature"];
    const endpointSecret = functions.config().stripe.webhook_secret;
    if (!endpointSecret) {
        console.error("Stripe webhook secret is not configured.");
        res.status(500).send("Webhook secret not configured.");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    }
    catch (err) {
        const message = (err instanceof Error) ? err.message : "Unknown error";
        console.error(`Webhook Error: ${message}`);
        res.status(400).send(`Webhook Error: ${message}`);
        return;
    }
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;
            }
            default: {
                console.log(`Unhandled event type: ${event.type}`);
            }
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        const message = (err instanceof Error) ?
            err.message :
            "Internal Server Error";
        console.error("Error handling webhook event:", err);
        res.status(500).send(message);
    }
});
//# sourceMappingURL=stripe.js.map