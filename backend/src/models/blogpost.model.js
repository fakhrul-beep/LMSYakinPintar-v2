import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    featuredImage: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, index: true },
    tags: [{ type: String, index: true }],
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft",
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

blogPostSchema.index({ title: "text", category: 1 });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ author: 1 });

export default mongoose.model("BlogPost", blogPostSchema);
