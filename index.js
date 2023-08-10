const express = require('express')
const mongoose = require('mongoose')
const Admin = require('./modelAdmin')
const UserSchema = require('./modelUser')

const app = express()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const cors = require('cors')
app.use(express.json())
app.use(cors())
const nodemailer = require('nodemailer');

mongoose.connect('mongodb+srv://bhagyashree:bhagya5799@cluster0.q2xpdj1.mongodb.net/?retryWrites=true&w=majority').then(
    () => console.log("DB Connected .....!")
).catch(err => console.log(err, "DB"))

app.get('/', (req, res) => {
    res.send('Hello world welcomeee  !!!')
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
    console.log(username, 'user')
    try {
        const existingUser = await Admin.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ error: 'User Already Exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 8);
        const newUserData = new Admin({ username, password: hashedPassword, id });
        await newUserData.save();
        res.status(200).json({ status: true, msg: 'Registered Successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const adminData = await Admin.findOne({ username: username });

        if (!adminData) {
            return res.status(400).json({ msg: "Invalid username" });
        }
        const isPasswordValid = await bcrypt.compare(password, adminData.password);

        if (isPasswordValid) {
            const payload = { password: password };
            console.log(payload)
            const jwtToken = jwt.sign(payload, "SECRET_ID", { expiresIn: 3600000 });
            // res.json({ jwtToken });
            res.send({ jwtToken })
        } else {
            res.status(400).json({ msg: "Invalid password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/user/register', async (req, res) => {
    const { username, email, password, address, phonenumber,id } = req.body;
    // console.log(username,password,email,id)

    try {
        // Check if user already exists
        const existingUser = await UserSchema.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserSchema({ username, email, address, phonenumber, password: hashedPassword, id });
        await user.save();

        const token = jwt.sign({ id: user._id }, 'SECRET_ID');
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/user/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userData = await UserSchema.findOne({ email: email });
        if (!userData) {
            return res.status(400).json({ msg: "Invalid Email" });
        }

        const isPasswordValid = await bcrypt.compare(password, userData.password);

        if (isPasswordValid) {
            // Include user details in the payload of the JWT token
            const payload = {
                id: userData.id, // Assuming _id is the user's unique identifier
                username: userData.username,
                email: userData.email,
                // Add any other user details you want to include
            };

            const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN", { expiresIn: 3600000 });
            res.json({ jwtToken, user: payload }); // Return JWT token and user details
        } else {
            res.status(400).json({ msg: "Invalid password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Define your verifyToken middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token)
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, 'SECRET_ID', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.userId = decoded.id;
        next();
    });
};

// Apply the middleware to a route that requires authentication
app.get('/user/dashboard',verifyToken, async (req, res) => {
    try {
        // Use req.userId to fetch user details from the database
        const user = await UserSchema.find();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User Dashboard', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/getOne/:id', async (req, res) => {
    const { id } = req.params
    try {
        const getOneUser = await UserSchema.find({ id: id })
        res.send(getOneUser)
    }
    catch (err) {
        console.log(err.message)
    }
})

app.delete('/delete-user/:id', async (req, res) => {
    const { id } = req.params
    console.log(id, 'id')
    try {
        await UserSchema.findOneAndDelete({ id: id })
        res.send({ status: true, msg: "Agent Delete success" })
    }
    catch (err) {
        console.log(err.message)
    }

})

app.put('/updateUser/:username', async (req, res) => {
    const { username } = req.params;
    const { email, phonenumber, address } = req.body;

    try {
        const updatedUser = await UserSchema.findOneAndUpdate(
            { username: username }, // Find the user by username
            { $set: { email, phonenumber, address } }, // Update the specified fields
            { new: true } // Return the updated user data
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(updatedUser);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// app.post('/generate-invite', async (req, res) => {
//     try {
//         const { expiresIn } = req.body;
//         const token = jwt.sign({ data: 'invite' }, 'your_secret_key', {
//             expiresIn,
//         });

//         const expiresAt = new Date();
//         expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

//         const newInvite = new Invite({
//             token,
//             expiresAt,
//             isUsed: false,
//         });

//         await newInvite.save();

//         res.json({ token });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// app.get('/verify-invite/:token', async (req, res) => {
//     try {
//         const { token } = req.params;

//         const invite = await Invite.findOne({ token, isUsed: false });
//         if (!invite || invite.expiresAt < new Date()) {
//             return res.status(400).json({ error: 'Invalid or expired invite token' });
//         }

//         // Fetch user data based on the invite token
//         const user = await UserSchema.findById(invite.userId);

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         // Mark the invite as used (optional)
//         invite.isUsed = true;
//         await invite.save();

//         res.json({ user });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

app.post('/generate-invite', async (req, res) => {
    try {
        const { expiresIn, email } = req.body; // Assuming you receive the user's email in the request

        const token = jwt.sign({ data: 'invite' }, 'your_secret_key', {
            expiresIn,
        });

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

        const newInvite = new inviteSchema({
            token,
            expiresAt,
            isUsed: false,
        });

        await newInvite.save();

        // Create a Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'smtp.gmail.com', // e.g., 'Gmail'
            port:567,
            secure:false,
            auth: {
                user: 'lbhagya818@gmail.com',
                pass: 'eekxsqyidrocgqno',
            },
        });

        // Compose the email
        const mailOptions = {
            from: 'lbhagya818@gmail.com',
            to: 'bhagya2pb@gmail.com', // User's email address
            subject: 'Invitation to Register',
            text: `You have been invited to register. Click on the following link to complete your registration: https://your-app.com/register/${token}`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
