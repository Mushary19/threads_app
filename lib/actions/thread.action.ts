"use server"

import { revalidatePath } from "next/cache"
import Thread from "../models/thread.model"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"

interface Params {
  text: string
  author: string
  communityId: string | null
  path: string
}

export async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectToDB()

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    })

    // Update User Model after creating the thread
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    })

    revalidatePath(path)
  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`)
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 2) {
  connectToDB()

  //   Calculate the no. of posts to skip
  const skipAmount = (pageNumber - 1) * pageSize

  //   Fetch the posts that have no parents (top-level-threads) {actual Threads}
  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: "author", model: User })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    })

  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  })

  const posts = await postsQuery.exec()

  const isNext = totalPostsCount > skipAmount + posts.length

  return { posts, isNext }
}

export async function fetchThreadById(id: string) {
  connectToDB()

  // TODO: Populate Community
  try {
    const thread = await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec()

    return thread
  } catch (error: any) {
    throw new Error(`Failed to find thread ${error.message}`)
  }
}

//--------------------------------------//
// Interface for addCommentToThread function
interface PropsComment {
  threadId: string,
  userId: string,
  commentText: string,
  path: string,
}

export async function addCommentToThread({
  threadId,
  userId,
  commentText,
  path
}: PropsComment) {
  connectToDB()

  try {
    // Find the original thread by its Id
    const originalThread = await Thread.findById(threadId)

    if (!originalThread) {
      throw new Error("Thread not found")
    }

    // create a new thread with the comment text
    const commentThread = new Thread({
      author: userId,
      text: commentText,
      parentId: threadId,
    })

    // Save the new thread
    const savedCommentThread = await commentThread.save()

    // Update the original thread to include the new comment
    originalThread.children.push(savedCommentThread._id)

    // SAVE the original thread
    await originalThread.save()

    revalidatePath(path)
  } catch (error: any) {
    throw new Error(`Failed to comment in the thread ${error.message}`)
  }
}
