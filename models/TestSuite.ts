import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITestCase {
  id: string
  title: string
  category: 'positive' | 'negative' | 'edge_case'
  priority: 'low' | 'medium' | 'high' | 'critical'
  preconditions: string
  steps: string[]
  expectedResult: string
  status: 'not_run' | 'pass' | 'fail' | 'blocked'
  notes: string
}

export interface ITestSuite extends Document {
  title: string
  description: string
  inputType: 'user_story' | 'feature_spec' | 'bug_report'
  inputText: string
  testingTypes: string[]
  priority: string
  aiModel: string
  healthScore: number
  testCases: ITestCase[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

const TestCaseSchema = new Schema<ITestCase>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['positive', 'negative', 'edge_case'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  preconditions: { type: String, default: '' },
  steps: [{ type: String }],
  expectedResult: { type: String, default: '' },
  status: {
    type: String,
    enum: ['not_run', 'pass', 'fail', 'blocked'],
    default: 'not_run',
  },
  notes: { type: String, default: '' },
})

const TestSuiteSchema = new Schema<ITestSuite>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    inputType: {
      type: String,
      enum: ['user_story', 'feature_spec', 'bug_report'],
      required: true,
    },
    inputText: { type: String, required: true },
    testingTypes: [{ type: String }],
    priority: { type: String, default: 'medium' },
    aiModel: { type: String, default: 'gemini-1.5-flash' },
    testCases: [TestCaseSchema],
    healthScore: { type: Number, default: 0 },
    userId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
)

TestSuiteSchema.index({ userId: 1, createdAt: -1 })

const TestSuite: Model<ITestSuite> =
  mongoose.models.TestSuite ?? mongoose.model<ITestSuite>('TestSuite', TestSuiteSchema)

export default TestSuite
