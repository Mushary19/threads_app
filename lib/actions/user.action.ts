"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model"
import { AnyExpression, FilterQuery, SortOrder } from "mongoose"

interface Params {
  userId: string
  username: string
  name: string
  bio: string
  image: string
  path: string
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  connectToDB()

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    )

    if (path === "/profile/edit") {
      revalidatePath(path)
    }
  } catch (error: any) {
    throw new Error(`Error updating/creating user ${error.message}`)
  }
}

// Function for getting the user
export async function fetchUser(userId: string) {
  try {
    connectToDB()

    return await User.findOne({ id: userId })
    // .populate({})
  } catch (error: any) {
    throw new Error(`Failed to fetch user data: ${error.message}`)
  }
}

export async function fetchUserThreads(userId: string) {
  try {
    connectToDB()

    // Find all threads authored by the user (userId)

    // TODO: Populate Community

    const thread = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: {
        path: "children",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "name image id",
        },
      },
    })

    return thread
  } catch (error: any) {
    throw new Error(`Error fetching fetchUserThreads: ${error.message}`)
  }
}

export async function fetchAllUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string
  searchString?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: SortOrder
}) {
  try {
    connectToDB()

    const skipAmount = (pageNumber - 1) * pageSize

    const regex = new RegExp(searchString, "i") // Case-insensitive search

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId },
    }

    if (searchString.trim() !== "") {
      query.$or = [{ username: { $regex: regex } }, { name: { $regex: regex } }]
    }

    const sortOptions = { createdAt: sortBy }

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)

    const totalUsersCount = await User.countDocuments(query)

    const users = await usersQuery.exec()

    const isNext = totalUsersCount > skipAmount + users.length

    return { users, isNext }
  } catch (error: any) {
    throw new Error(`Error fetching all Users: ${error.message}`)
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB()

    // Find all the threads created by the user
    const userThreads = await Thread.find({ author: userId })

    // Collect all the child thread ids (replies) from the 'children' field
    // Acc is an empty array for the 1st time
    const childThreads = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children)
    }, [])

    const replies = await Thread.find({
      _id: { $in: childThreads },
      author: { $ne: userId },
    }).populate({
      path: "author",
      model: User,
      select: "name image _id id",
    })

    return replies

  } catch (error: any) {
    throw new Error(`Error getting activities / notification: ${error.message}`)
  }
}
