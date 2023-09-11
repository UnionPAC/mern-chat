import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

//@desc     Create or fetch One to One Chat
//@route    POST /api/chats
//@access   Private
const accessChat = asyncHandler(async (req, res) => {
  const { id: userId } = req.body;

  // must include the user you wish to chat with
  if (!userId) {
    res.status(400);
    throw new Error("Must include a User Id");
  }

  const userToChat = await User.findById(userId);

  if (!userToChat) {
    res.status(400);
    throw new Error("Cannot find the user you are wanting to chat with");
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } }, // the request sender (YOU)
      { users: { $elemMatch: { $eq: userId } } }, // the user you want to chat with
    ],
  })
    .populate("users", "-password")
    .populate("lastMessage");

  isChat = await User.populate(isChat, {
    path: "lastMessage.sender",
    select: "username profilePic",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    const newChatData = {
      name: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createdChat = await Chat.create(newChatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(201).json(fullChat);
    } catch (error) {
      res.status(400);
      throw new Error("Failed to create new chat");
    }
  }
});

//@desc     Fetch all chats for a user
//@route    GET /api/chats
//@access   Private
const fetchChats = asyncHandler(async (req, res) => {
  try {
    // find all chats that the user is in
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const results = await User.populate(chats, {
      path: "lastMessage.sender",
      select: "username profilePic",
    });

    res.status(200).send(results);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@desc     Create New Group Chat
//@route    POST /api/chats/group
//@access   Private
const createGroupChat = asyncHandler(async (req, res) => {
  console.log(req.body);
  // group name and group users must be filled out
  if (!req.body.users) {
    res.status(400);
    throw new Error("Group chat must have users");
  }

  if (!req.body.name) {
    res.status(400);
    throw new Error("Group chat must have a name");
  }

  const users = JSON.parse(req.body.users);

  if (users.length < 2) {
    res.status(400);
    throw new Error("Group chat must have at least 2 other members");
  }

  users.push(req.user);

  try {
    // create a new group chat to our db
    const groupChat = await Chat.create({
      name: req.body.name,
      isGroupChat: true,
      users,
      groupAdmin: req.user,
    });

    // return our chat
    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chats/rename
// @access  Private
const renameGroupChat = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatName || chatName === "") {
    res.status(400);
    throw new Error("Please enter a group name");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      name: chatName,
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chats/groupremove
// @access  Private
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  console.log(chatId, userId);

  const chatToUpdate = await Chat.findById(chatId);

  if (!chatToUpdate) {
    res.status(404).send("Chat not found.");
    return;
  }

  if (req.user._id.toString() !== chatToUpdate.groupAdmin.toString()) {
    res.status(403).send("Only the group admin can remove user.");
    return;
  }

  try {
    chatToUpdate.users.pull(userId);
    await chatToUpdate.save();

    // send result
    const updatedChat = await Chat.findById(chatId)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chats/groupadd
// @access  Private
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chatToUpdate = await Chat.findById(chatId);

  if (!chatToUpdate) {
    res.status(404).send("Chat not found.");
    return;
  }

  if (req.user._id.toString() !== chatToUpdate.groupAdmin.toString()) {
    res.status(403).send("Only the group admin can add user.");
    return;
  }

  try {
    chatToUpdate.users.push(userId);
    await chatToUpdate.save();

    // send result
    const updatedChat = await Chat.findById(chatId)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Delete chat
// @route   DELETE /api/chats
// @access  Private
const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  const chat = await Chat.findById(chatId);

  if (chat) {
    await Chat.deleteOne(chat);
    res.status(200).json({ message: "Successfully deleted chat!" });
  } else {
    res.status(404);
    throw new Error("Chat not found!");
  }
});

export {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  removeFromGroup,
  addToGroup,
  deleteChat,
};
