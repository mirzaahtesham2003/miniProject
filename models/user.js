const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/miniProject");

const userSchema = mongoose.Schema ({
    username: String,
    name: String,
    email: String,
    age: Number,
    password: String,
    post: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]
})

module.exports = mongoose.model("user", userSchema);