const User = require('../models/User');

async function canChat(meId, otherId) {
  if (!meId || !otherId) return false;
  const me = String(meId);
  const other = String(otherId);
  if (me === other) return false;

  const meDoc = await User.findById(me).select('following followers').lean();
  if (!meDoc) return false;

  const iFollow = (meDoc.following || []).some((id) => String(id) === other);
  const followsMe = (meDoc.followers || []).some((id) => String(id) === other);
  return iFollow && followsMe;
}

async function mutualFollowsOf(meId) {
  const me = await User.findById(meId).select('following followers').lean();
  if (!me) return [];
  const following = new Set((me.following || []).map((id) => String(id)));
  return (me.followers || [])
    .map((id) => String(id))
    .filter((id) => following.has(id));
}

module.exports = { canChat, mutualFollowsOf };
