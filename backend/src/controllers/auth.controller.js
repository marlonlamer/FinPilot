const prisma = require("../prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email,
        password: hashedPassword
      }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({ token, id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "User already exists or failed to register" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;


  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, id: user.id, email: user.email, name: user.name });
  } catch (error) {
    res.status(500).json({error: "Failed to Login"});
  }
};

module.exports = {
  register,
  login
};
