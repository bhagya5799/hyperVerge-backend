const express = require('express')
const mongoose = require('mongoose')
const Admin = require('./modelAdmin')
const UserSchema =require('./modelUser')


const app = express()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const cors = require('cors')
app.use(express.json())
app.use(cors())

mongoose.connect('mongodb+srv://bhagyashree:bhagya5799@cluster0.q2xpdj1.mongodb.net/?retryWrites=true&w=majority').then(
    () => console.log("DB Connected .....!")
).catch(err => console.log(err, "DB"))

app.get('/', (req, res) => {
    res.send('Hello world welcome  !!!')
})


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const port = process.env.PORT || 3006
app.listen(port, () => console.log(`Example app listening on port ${port}!`))


app.post("/add", async (req, res) => {
    const { username, password, id } = req.body;
    try {
        const getUserName = await Admin.findOne({ username: username });
        if (getUserName) {
            res.status(400);
            res.send({ status: false, msg: 'User Already Exist' });
        } else {
            const hashedPassword = await bcrypt.hash(password, 8);
            const inviteLink = generateUniqueInviteLink(); // Implement this function to generate a unique invite link.
            const newUserData = new Admin({ username, password: hashedPassword, id, inviteLink });
            await newUserData.save();
            res.status(200);
            res.send({ status: true, msg: 'Registered Successfully' });
        }
    }
    catch (err) {
        console.log(err.message);
        res.status(500);
        res.send({ status: false, msg: 'Internal Server Error' });
    }
});


app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const adminData = await Admin.findOne({ username: username });
        console.log(adminData, 'user');
        if (!adminData) {
            return res.status(400).json({ msg: "Invalid username" });
        }

        const isPasswordValid = await bcrypt.compare(password, adminData.password);

        if (isPasswordValid) {
            const payload = { password: password };
            console.log(payload)
            const jwtToken = jwt.sign(payload, "SECRET_ID", { expiresIn: 3600000 });
            res.json({ jwtToken });
        } else {
            res.status(400).json({ msg: "Invalid password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'your_secret_key_here', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.userId = decoded.id;
        next();
    });
};

app.post('/user/register', async (req, res) => {
    const { username, password,id } = req.body;

    try {
        // Check if user already exists
        const existingUser = await UserSchema.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserSchema({username, password: hashedPassword ,id});
        await user.save();

        const token = jwt.sign({ id: user._id }, 'SECRET_ID');
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/user/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const userData = await UserSchema.findOne({ username: username });
        console.log(userData, 'user');
        if (!userData) {
            return res.status(400).json({ msg: "Invalid username" });
        }

        const isPasswordValid = await bcrypt.compare(password, userData.password);

        if (isPasswordValid) {
            const payload = { password: password };
            console.log(payload)
            const jwtToken = jwt.sign(payload, "SECRET_ID", { expiresIn: 3600000 });
            res.json({ jwtToken });
        } else {
            res.status(400).json({ msg: "Invalid password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Apply the middleware to routes that require authentication
app.get('/use/dashboard', verifyToken, async (req, res) => {
    // Use req.userId to fetch user details from the database and send the res
    // You can use the User model and req.userId to fetch user details here
    res.json({ message: 'User Dashboard' });
});

app.get('/user/dashboard', async (req, res) => {
    let { username } = req.body;
    console.log(username)
    try {
        const getData = await UserSchema.find()
        console.log(getData)
        res.send(getData)
    }
    catch (err) {
        res.send(err.message)
    }
})


app.delete('/delete-user/:id', async (req, res) => {
    const { id} = req.params
    console.log(id)
    try {
        await UserSchema.findOneAndDelete({ id: id })
        res.send({ status: true, msg: "Agent Delete success" })
    }
    catch (err) {
        console.log(err.message)
    }

})
