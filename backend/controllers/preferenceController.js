import prisma from "../config/prisma.js";

// GET USER PREFERENCES
export const getPreferences = async (req, res) => {
  const userId = parseInt(req.params.userId);
  
  try {
    const prefs = await prisma.preference.findUnique({
      where: { user_id: userId },
    });

    if (!prefs) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE / CREATE PREFERENCES
export const updatePreferences = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { offers, order_updates, newsletter } = req.body;

  // console.log(req.user.userId, userId);
  
  if(req.user.userId !== userId){
    return  res.status(403).json({ message: "Forbidden" });
  }

  try {
    const existing = await prisma.preference.findUnique({
      where: { user_id: userId },
    });

    let prefs;

    if (existing) {
      prefs = await prisma.preference.update({
        where: { user_id: userId },
        data: { offers, order_updates, newsletter },
      });
    } else {
      prefs = await prisma.preference.create({
        data: {
          user_id: userId,
          offers,
          order_updates,
          newsletter,
        },
      });
    }

    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
