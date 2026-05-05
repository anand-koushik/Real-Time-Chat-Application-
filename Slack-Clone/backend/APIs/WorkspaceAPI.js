import exp from "express";
import { verifyToken } from "../middlewares/VerifyToken.js";
import { WorkspaceModel } from "../models/WorkspaceModel.js";
import { UserModel } from "../models/UserModel.js";

export const workspaceApp = exp.Router();


// Create workspace
workspaceApp.post("/workspaces", verifyToken("USER", "ADMIN"), async (req, res) => {
  try {
    const workspaceObj = req.body;
    const userId = req.user?.id;

    workspaceObj.owner = userId;
    workspaceObj.members = [
      {
        user: userId,
        role: "OWNER",
        joinedAt: new Date(),
      },
    ];

    const newWorkspace = new WorkspaceModel(workspaceObj);
    await newWorkspace.save();

    await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { workspaces: newWorkspace._id } },
      { new: true }
    );

    res.status(201).json({
      message: "Workspace created successfully",
      payload: newWorkspace,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error creating workspace",
      error: err.message,
    });
  }
});


// Get workspaces of logged in user
workspaceApp.get("/workspaces", verifyToken("USER", "ADMIN"), async (req, res) => {
  try {
    const userId = req.user?.id;

    const workspacesList = await WorkspaceModel.find({
      "members.user": userId,
      isWorkspaceActive: true,
    })
      .populate("owner", "firstName lastName email profileImageUrl")
      .populate("members.user", "firstName lastName email profileImageUrl");

    res.status(200).json({
      message: "Workspaces fetched successfully",
      payload: workspacesList,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error fetching workspaces",
      error: err.message,
    });
  }
});


// Get single workspace
workspaceApp.get("/workspace/:id", verifyToken("USER", "ADMIN"), async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userId = req.user?.id;

    const workspace = await WorkspaceModel.findOne({
      _id: workspaceId,
      "members.user": userId,
      isWorkspaceActive: true,
    })
      .populate("owner", "firstName lastName email profileImageUrl")
      .populate("members.user", "firstName lastName email profileImageUrl");

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
        error: "Invalid workspace or you are not a member",
      });
    }

    res.status(200).json({
      message: "Workspace found",
      payload: workspace,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error fetching workspace",
      error: err.message,
    });
  }
});


// Add member to workspace
workspaceApp.put("/workspace/member", verifyToken("USER", "ADMIN"), async (req, res) => {
  try {
    const { workspaceId, email, role } = req.body;
    const userId = req.user?.id;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
        error: "Invalid workspace id",
      });
    }

    const loggedInMember = workspace.members.find(
      member => member.user.toString() === userId
    );

    if (!loggedInMember || !["OWNER", "ADMIN"].includes(loggedInMember.role)) {
      return res.status(403).json({
        message: "You are not authorised",
        error: "Only workspace owner or admin can add members",
      });
    }

    const userToAdd = await UserModel.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({
        message: "User not found",
        error: "No user exists with this email",
      });
    }

    const alreadyMember = workspace.members.find(
      member => member.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "User already exists in workspace",
        error: "Duplicate workspace member",
      });
    }

    workspace.members.push({
      user: userToAdd._id,
      role: role || "MEMBER",
      joinedAt: new Date(),
    });

    await workspace.save();

    await UserModel.findByIdAndUpdate(
      userToAdd._id,
      { $addToSet: { workspaces: workspace._id } },
      { new: true }
    );

    res.status(200).json({
      message: "Member added successfully",
      payload: workspace,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error adding member",
      error: err.message,
    });
  }
});


// Soft delete or restore workspace
workspaceApp.patch("/workspace/status", verifyToken("USER", "ADMIN"), async (req, res) => {
  try {
    const { workspaceId, isWorkspaceActive } = req.body;
    const userId = req.user?.id;

    const updatedWorkspace = await WorkspaceModel.findOneAndUpdate(
      {
        _id: workspaceId,
        owner: userId,
      },
      { isWorkspaceActive },
      { new: true }
    );

    if (!updatedWorkspace) {
      return res.status(403).json({
        message: "You are not authorised",
        error: "Only workspace owner can update workspace status",
      });
    }

    res.status(200).json({
      message: isWorkspaceActive ? "Workspace restored successfully" : "Workspace deleted successfully",
      payload: updatedWorkspace,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error updating workspace status",
      error: err.message,
    });
  }
});
