import { MessageModel } from "../models/MessageModel.js";
import { NotificationModel } from "../models/NotificationModel.js";

export const registerSocketEvents = (io, socket) => {

  // Join workspace room
  socket.on("join-workspace", (workspaceId) => {
    socket.join(`workspace-${workspaceId}`);

    socket.emit("workspace-joined", {
      message: "Workspace joined",
      payload: { workspaceId },
    });
  });


  // Join channel room
  socket.on("join-channel", (channelId) => {
    socket.join(`channel-${channelId}`);

    socket.emit("channel-joined", {
      message: "Channel joined",
      payload: { channelId },
    });
  });


  // Join direct message room
  socket.on("join-direct-message", (receiverId) => {
    const senderId = socket.user?.id;

    const roomId = [senderId, receiverId].sort().join("-");

    socket.join(`dm-${roomId}`);

    socket.emit("direct-message-joined", {
      message: "Direct message joined",
      payload: { roomId },
    });
  });


  // Send real-time message
  socket.on("send-message", async (messageObj) => {
    try {
      const newMessage = new MessageModel({
        ...messageObj,
        sender: socket.user?.id,
      });

      await newMessage.save();

      if (newMessage.messageType === "CHANNEL") {
        io.to(`channel-${newMessage.channel}`).emit("receive-message", {
          message: "Message received",
          payload: newMessage,
        });
      }

      if (newMessage.messageType === "DIRECT") {
        const roomId = [newMessage.sender.toString(), newMessage.receiver.toString()].sort().join("-");

        io.to(`dm-${roomId}`).emit("receive-message", {
          message: "Message received",
          payload: newMessage,
        });

        io.to(`user-${newMessage.receiver}`).emit("new-notification", {
          message: "New notification",
          payload: {
            notificationType: "MESSAGE",
            text: "You received a new direct message",
          },
        });
      }

    } catch (err) {
      socket.emit("socket-error", {
        message: "Error sending message",
        error: err.message,
      });
    }
  });


  // Edit message
  socket.on("edit-message", async (messageObj) => {
    try {
      const { messageId, content } = messageObj;

      const updatedMessage = await MessageModel.findOneAndUpdate(
        {
          _id: messageId,
          sender: socket.user?.id,
          isMessageActive: true,
        },
        {
          content,
          isEdited: true,
        },
        { new: true }
      );

      if (!updatedMessage) {
        return socket.emit("socket-error", {
          message: "You are not authorised",
          error: "Only sender can edit this message",
        });
      }

      if (updatedMessage.messageType === "CHANNEL") {
        io.to(`channel-${updatedMessage.channel}`).emit("message-edited", {
          message: "Message edited",
          payload: updatedMessage,
        });
      }

      if (updatedMessage.messageType === "DIRECT") {
        const roomId = [updatedMessage.sender.toString(), updatedMessage.receiver.toString()].sort().join("-");

        io.to(`dm-${roomId}`).emit("message-edited", {
          message: "Message edited",
          payload: updatedMessage,
        });
      }

    } catch (err) {
      socket.emit("socket-error", {
        message: "Error editing message",
        error: err.message,
      });
    }
  });


  // Add or update reaction
  socket.on("add-reaction", async (reactionObj) => {
    try {
      const { messageId, reaction } = reactionObj;

      const messageDoc = await MessageModel.findById(messageId);

      if (!messageDoc) {
        return socket.emit("socket-error", {
          message: "Message not found",
          error: "Invalid message id",
        });
      }

      const existingReaction = messageDoc.reactions.find(
        item => item.user.toString() === socket.user?.id
      );

      if (existingReaction) {
        existingReaction.reaction = reaction;
        existingReaction.createdAt = new Date();
      } else {
        messageDoc.reactions.push({
          user: socket.user?.id,
          reaction,
          createdAt: new Date(),
        });
      }

      await messageDoc.save();

      if (messageDoc.messageType === "CHANNEL") {
        io.to(`channel-${messageDoc.channel}`).emit("reaction-added", {
          message: "Reaction added",
          payload: messageDoc,
        });
      }

      if (messageDoc.messageType === "DIRECT") {
        const roomId = [messageDoc.sender.toString(), messageDoc.receiver.toString()].sort().join("-");

        io.to(`dm-${roomId}`).emit("reaction-added", {
          message: "Reaction added",
          payload: messageDoc,
        });
      }

    } catch (err) {
      socket.emit("socket-error", {
        message: "Error adding reaction",
        error: err.message,
      });
    }
  });


  // Remove reaction
  socket.on("remove-reaction", async (reactionObj) => {
    try {
      const { messageId } = reactionObj;

      const messageDoc = await MessageModel.findById(messageId);

      if (!messageDoc) {
        return socket.emit("socket-error", {
          message: "Message not found",
          error: "Invalid message id",
        });
      }

      messageDoc.reactions = messageDoc.reactions.filter(
        item => item.user.toString() !== socket.user?.id
      );

      await messageDoc.save();

      if (messageDoc.messageType === "CHANNEL") {
        io.to(`channel-${messageDoc.channel}`).emit("reaction-removed", {
          message: "Reaction removed",
          payload: messageDoc,
        });
      }

      if (messageDoc.messageType === "DIRECT") {
        const roomId = [messageDoc.sender.toString(), messageDoc.receiver.toString()].sort().join("-");

        io.to(`dm-${roomId}`).emit("reaction-removed", {
          message: "Reaction removed",
          payload: messageDoc,
        });
      }

    } catch (err) {
      socket.emit("socket-error", {
        message: "Error removing reaction",
        error: err.message,
      });
    }
  });


  // Add thread reply
  socket.on("thread-reply", async (replyObj) => {
    try {
      const { messageId, content } = replyObj;

      const messageDoc = await MessageModel.findOne({
        _id: messageId,
        isMessageActive: true,
      });

      if (!messageDoc) {
        return socket.emit("socket-error", {
          message: "Message not found",
          error: "Invalid message id",
        });
      }

      messageDoc.threadReplies.push({
        sender: socket.user?.id,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await messageDoc.save();

      if (messageDoc.messageType === "CHANNEL") {
        io.to(`channel-${messageDoc.channel}`).emit("thread-reply-added", {
          message: "Thread reply added",
          payload: messageDoc,
        });
      }

      if (messageDoc.messageType === "DIRECT") {
        const roomId = [messageDoc.sender.toString(), messageDoc.receiver.toString()].sort().join("-");

        io.to(`dm-${roomId}`).emit("thread-reply-added", {
          message: "Thread reply added",
          payload: messageDoc,
        });
      }

    } catch (err) {
      socket.emit("socket-error", {
        message: "Error adding thread reply",
        error: err.message,
      });
    }
  });


  // File shared after REST upload
  socket.on("file-shared", (messageObj) => {
    if (messageObj.messageType === "CHANNEL") {
      io.to(`channel-${messageObj.channel}`).emit("receive-file", {
        message: "File received",
        payload: messageObj,
      });
    }

    if (messageObj.messageType === "DIRECT") {
      const roomId = [messageObj.sender.toString(), messageObj.receiver.toString()].sort().join("-");

      io.to(`dm-${roomId}`).emit("receive-file", {
        message: "File received",
        payload: messageObj,
      });
    }
  });

};
