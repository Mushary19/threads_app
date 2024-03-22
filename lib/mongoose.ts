import mongoose from "mongoose"

let isConnected = false // Variable to check if mongoose in connected

export const connectToDB = async () => {
    mongoose.set('strictQuery', true)

    if (!process.env.MONGODB_URL) return console.log('MongoDB URL not found')

    if (isConnected) return console.log('Already connected to Database')

    try {
        await mongoose.connect(process.env.MONGODB_URL)

        isConnected = true
        console.log('Connected to Database')
    } catch (error) {
        console.log(error)
    }
}
