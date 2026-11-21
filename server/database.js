import { MongoClient } from 'mongodb'
import { databaseName, mongoUri } from './config.js'

export const mongo = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2000 })
export const database = mongo.db(databaseName)
