import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const onAuthUserCreate = functions.auth.user().onCreate(async (user) => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const email = (user.email || "").toLowerCase();
  const role = adminEmail && email === adminEmail ? "ADMIN" : "USER";

  await db.collection("users").doc(user.uid).set(
    {
      email: user.email || null,
      name: user.displayName || null,
      phone: user.phoneNumber || null,
      role,
      image: user.photoURL || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});

export const health = functions.https.onRequest((_req, res) => {
  res.json({ status: "ok", service: "hukan-functions" });
});
