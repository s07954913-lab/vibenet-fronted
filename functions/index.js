const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ==============================
// HELPER: Send Push Notification
// ==============================
async function sendNotification(recipientUserId, notification) {
  try {
    // Get recipient's FCM tokens
    const tokensSnap = await db
      .collection("users")
      .doc(recipientUserId)
      .collection("fcmTokens")
      .get();

    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map((doc) => doc.id);

    // Save notification to Firestore (for in-app notification bell)
    await db
      .collection("users")
      .doc(recipientUserId)
      .collection("notifications")
      .add({
        ...notification,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Send push notification to all devices
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: notification.type,
        senderId: notification.senderId || "",
        postId: notification.postId || "",
        commentId: notification.commentId || "",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      tokens: tokens,
    };

    await messaging.sendEachForMulticast(message);
    console.log(`✅ Notification sent to user: ${recipientUserId}`);
  } catch (error) {
    console.error("❌ Notification error:", error);
  }
}

// ==============================
// 1. LIKE NOTIFICATION
// ==============================
exports.onLike = functions.firestore
  .document("posts/{postId}/likes/{likeId}")
  .onCreate(async (snap, context) => {
    const likeData = snap.data();
    const postId = context.params.postId;

    const postDoc = await db.collection("posts").doc(postId).get();
    const postOwnerId = postDoc.data()?.userId;

    if (!postOwnerId || postOwnerId === likeData.userId) return;

    // Get liker's info
    const likerDoc = await db.collection("users").doc(likeData.userId).get();
    const likerName = likerDoc.data()?.username || "Someone";
    const likerPhoto = likerDoc.data()?.photoURL || "";

    await sendNotification(postOwnerId, {
      type: "like",
      title: "New Like ❤️",
      body: `${likerName} liked your video`,
      senderId: likeData.userId,
      senderName: likerName,
      senderPhoto: likerPhoto,
      postId: postId,
    });
  });

// ==============================
// 2. COMMENT NOTIFICATION
// ==============================
exports.onComment = functions.firestore
  .document("posts/{postId}/comments/{commentId}")
  .onCreate(async (snap, context) => {
    const commentData = snap.data();
    const postId = context.params.postId;
    const commentId = context.params.commentId;

    const postDoc = await db.collection("posts").doc(postId).get();
    const postOwnerId = postDoc.data()?.userId;

    if (!postOwnerId || postOwnerId === commentData.userId) return;

    const commenterDoc = await db
      .collection("users")
      .doc(commentData.userId)
      .get();
    const commenterName = commenterDoc.data()?.username || "Someone";
    const commenterPhoto = commenterDoc.data()?.photoURL || "";

    const commentText =
      commentData.text?.length > 50
        ? commentData.text.substring(0, 50) + "..."
        : commentData.text;

    await sendNotification(postOwnerId, {
      type: "comment",
      title: "New Comment 💬",
      body: `${commenterName}: ${commentText}`,
      senderId: commentData.userId,
      senderName: commenterName,
      senderPhoto: commenterPhoto,
      postId: postId,
      commentId: commentId,
    });
  });

// ==============================
// 3. COMMENT LIKE NOTIFICATION
// ==============================
exports.onCommentLike = functions.firestore
  .document("posts/{postId}/comments/{commentId}/likes/{likeId}")
  .onCreate(async (snap, context) => {
    const likeData = snap.data();
    const { postId, commentId } = context.params;

    const commentDoc = await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .get();

    const commentOwnerId = commentDoc.data()?.userId;

    if (!commentOwnerId || commentOwnerId === likeData.userId) return;

    const likerDoc = await db.collection("users").doc(likeData.userId).get();
    const likerName = likerDoc.data()?.username || "Someone";
    const likerPhoto = likerDoc.data()?.photoURL || "";

    await sendNotification(commentOwnerId, {
      type: "comment_like",
      title: "Comment Liked ❤️",
      body: `${likerName} liked your comment`,
      senderId: likeData.userId,
      senderName: likerName,
      senderPhoto: likerPhoto,
      postId: postId,
      commentId: commentId,
    });
  });

// ==============================
// 4. FOLLOW NOTIFICATION
// ==============================
exports.onFollow = functions.firestore
  .document("users/{userId}/followers/{followerId}")
  .onCreate(async (snap, context) => {
    const { userId, followerId } = context.params;

    if (userId === followerId) return;

    const followerDoc = await db.collection("users").doc(followerId).get();
    const followerName = followerDoc.data()?.username || "Someone";
    const followerPhoto = followerDoc.data()?.photoURL || "";

    await sendNotification(userId, {
      type: "follow",
      title: "New Follower 🔔",
      body: `${followerName} started following you`,
      senderId: followerId,
      senderName: followerName,
      senderPhoto: followerPhoto,
    });
  });

// ==============================
// 5. MENTION NOTIFICATION
// ==============================
exports.onMention = functions.firestore
  .document("posts/{postId}/comments/{commentId}")
  .onCreate(async (snap, context) => {
    const commentData = snap.data();
    const postId = context.params.postId;
    const commentId = context.params.commentId;

    const mentionedUsers = commentData.mentions || [];
    if (mentionedUsers.length === 0) return;

    const commenterDoc = await db
      .collection("users")
      .doc(commentData.userId)
      .get();
    const commenterName = commenterDoc.data()?.username || "Someone";
    const commenterPhoto = commenterDoc.data()?.photoURL || "";

    for (const mentionedUserId of mentionedUsers) {
      if (mentionedUserId === commentData.userId) continue;

      await sendNotification(mentionedUserId, {
        type: "mention",
        title: "You were mentioned 📢",
        body: `${commenterName} mentioned you in a comment`,
        senderId: commentData.userId,
        senderName: commenterName,
        senderPhoto: commenterPhoto,
        postId: postId,
        commentId: commentId,
      });
    }
  });

// ==============================
// 6. DIRECT MESSAGE NOTIFICATION
// ==============================
exports.onNewMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const messageData = snap.data();
    const chatId = context.params.chatId;

    const chatDoc = await db.collection("chats").doc(chatId).get();
    const participants = chatDoc.data()?.participants || [];

    const recipientId = participants.find((id) => id !== messageData.senderId);
    if (!recipientId) return;

    const senderDoc = await db
      .collection("users")
      .doc(messageData.senderId)
      .get();
    const senderName = senderDoc.data()?.username || "Someone";
    const senderPhoto = senderDoc.data()?.photoURL || "";

    const messageText =
      messageData.type === "image"
        ? "Sent you a photo 📷"
        : messageData.type === "video"
        ? "Sent you a video 🎥"
        : messageData.text?.length > 50
        ? messageData.text.substring(0, 50) + "..."
        : messageData.text;

    await sendNotification(recipientId, {
      type: "message",
      title: senderName,
      body: messageText,
      senderId: messageData.senderId,
      senderName: senderName,
      senderPhoto: senderPhoto,
      chatId: chatId,
    });
  });

// ==============================
// 7. VIDEO SHARE NOTIFICATION
// ==============================
exports.onVideoShare = functions.firestore
  .document("posts/{postId}/shares/{shareId}")
  .onCreate(async (snap, context) => {
    const shareData = snap.data();
    const postId = context.params.postId;

    const postDoc = await db.collection("posts").doc(postId).get();
    const postOwnerId = postDoc.data()?.userId;

    if (!postOwnerId || postOwnerId === shareData.userId) return;

    const sharerDoc = await db.collection("users").doc(shareData.userId).get();
    const sharerName = sharerDoc.data()?.username || "Someone";
    const sharerPhoto = sharerDoc.data()?.photoURL || "";

    await sendNotification(postOwnerId, {
      type: "share",
      title: "Video Shared 🔁",
      body: `${sharerName} shared your video`,
      senderId: shareData.userId,
      senderName: sharerName,
      senderPhoto: sharerPhoto,
      postId: postId,
    });
  });

// ==============================
// 8. LIVE STREAM NOTIFICATION
// ==============================
exports.onGoLive = functions.firestore
  .document("livestreams/{streamId}")
  .onCreate(async (snap, context) => {
    const streamData = snap.data();
    const hostId = streamData.hostId;

    if (!hostId) return;

    // Get all followers of the host
    const followersSnap = await db
      .collection("users")
      .doc(hostId)
      .collection("followers")
      .get();

    if (followersSnap.empty) return;

    const hostDoc = await db.collection("users").doc(hostId).get();
    const hostName = hostDoc.data()?.username || "Someone";
    const hostPhoto = hostDoc.data()?.photoURL || "";

    // Notify all followers
    const notifyPromises = followersSnap.docs.map((followerDoc) =>
      sendNotification(followerDoc.id, {
        type: "live",
        title: "🔴 LIVE",
        body: `${hostName} is now live!`,
        senderId: hostId,
        senderName: hostName,
        senderPhoto: hostPhoto,
        streamId: context.params.streamId,
      })
    );

    await Promise.all(notifyPromises);
  });

// ==============================
// 9. REPLY TO COMMENT NOTIFICATION
// ==============================
exports.onCommentReply = functions.firestore
  .document("posts/{postId}/comments/{commentId}/replies/{replyId}")
  .onCreate(async (snap, context) => {
    const replyData = snap.data();
    const { postId, commentId } = context.params;

    const commentDoc = await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .get();

    const commentOwnerId = commentDoc.data()?.userId;

    if (!commentOwnerId || commentOwnerId === replyData.userId) return;

    const replierDoc = await db.collection("users").doc(replyData.userId).get();
    const replierName = replierDoc.data()?.username || "Someone";
    const replierPhoto = replierDoc.data()?.photoURL || "";

    await sendNotification(commentOwnerId, {
      type: "reply",
      title: "New Reply 💬",
      body: `${replierName} replied to your comment`,
      senderId: replyData.userId,
      senderName: replierName,
      senderPhoto: replierPhoto,
      postId: postId,
      commentId: commentId,
    });
  });

// ==============================
// 10. MARK NOTIFICATIONS AS READ
// ==============================
exports.markNotificationsRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required");
  }

  const userId = context.auth.uid;
  const { notificationIds } = data;

  const batch = db.batch();

  if (notificationIds && notificationIds.length > 0) {
    // Mark specific notifications
    notificationIds.forEach((notifId) => {
      const ref = db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc(notifId);
      batch.update(ref, { isRead: true });
    });
  } else {
    // Mark all as read
    const unreadSnap = await db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .where("isRead", "==", false)
      .get();

    unreadSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
  }

  await batch.commit();
  return { success: true };
});