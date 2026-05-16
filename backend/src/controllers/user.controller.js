const prisma = require("../prisma/client");

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || String(name).trim() === "") return res.status(400).json({ error: "Name is required" });

    const updated = await prisma.user.update({ where: { id: Number(req.userId) }, data: { name: String(name).trim() } });
    res.json({ id: updated.id, email: updated.email, name: updated.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

module.exports = { updateProfile };
