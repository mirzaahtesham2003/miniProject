const express = require('express');
const app = express();
const upload = require('./config/multer')

const userModel = require("./models/user");
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const postModel = require('./models/post');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser());


app.get('/', (req, res) => {
    res.render('login');
})

app.get('/signup', (req, res) => {
    res.render('index');
})

app.post('/login', async (req, res) => {
    let {password, username} = req.body;
    let user = await userModel.findOne({username});
    if(!user) return res.status(500).send("Something went wrong...!");
    bcrypt.compare(password, user.password, (err, result) => {
        if(result) {
            let token = jwt.sign({ username: username, userid: user._id }, 'shhhhh');
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        }
        else res.status(500).send("Incorrect username or password");
    });
})

app.post('/signup', async (req, res) => {
    let {email, password, age, username, name } = req.body;
    let user = await userModel.findOne({email})
    if(user) return res.status(500).send("User already registered");
    else{
        bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            console.log(hash);
            let newUser = await userModel.create({
                name,
                email,
                password: hash,
                age,
                username
            });
            let token = jwt.sign({ email: email, userid: newUser._id }, 'shhhhh');
            res.cookie("token", token);
            res.send("Registered");
        });
    });
    }
})

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.render("login");
})

function isLoggedIn(req, res, next){
    if(req.cookies.token === "") res.send('Please login to access');
    else{
        let data = jwt.verify(req.cookies.token, 'shhhhh');
        req.user = data;
    }
    next();
}

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({username: req.user.username})
                              .populate('post');
    res.render('profile', { user });

})
app.get('/profile/upload', (req, res) => {
    res.render('multer');
})

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({username: req.user.username});
    let {content} = req.body;
    let post = await postModel.create({
        user: user._id,
        content
    });

    user.post.push(post._id);
    await user.save();

    user = await user.populate('post');
    res.render('profile', {user});
});

app.post('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id});

    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect('/profile');  
});

app.post('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id});
    res.render('edit-post', { post });


});

app.post('/update/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content} );
    res.redirect('/profile');

} )

app.post('/upload', isLoggedIn ,upload.single('image'), async (req, res) => {
    console.log("req.user:", req.user); // check karo kya aa raha hai
    console.log("req.file:", req.file);

    let user = await userModel.findById(req.user.userid);

    if (!user) {
        return res.status(404).send("User not found!");
    }

    user.profilepic = req.file.filename;
    await user.save();
    console.log("req.user:", req.user);

    res.redirect("/profile");

})


app.listen(3000);