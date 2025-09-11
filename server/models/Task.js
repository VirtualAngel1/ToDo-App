import mongoose from 'mongoose';

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    text: {
      type: String,
      required: [true, 'Task text is required'],
      minlength: [1, 'Task text must not be empty'],
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    owner: {
      type: String,
      required: [true, 'Task owner is required'],
      index: true
    }
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
