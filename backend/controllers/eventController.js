const { db } = require('../config/firebase');
const { list, getOne, now } = require('../services/db');
const ApiError = require('../utils/ApiError');

exports.listEvents = async (req, res) => {
  const events = await list('events');
  const regs = await list('eventRegistrations');
  const counts = {};
  regs.forEach((r) => { counts[r.eventId] = (counts[r.eventId] || 0) + 1; });
  const mine = new Set(regs.filter((r) => r.studentId === req.user.uid).map((r) => r.eventId));
  res.json(
    events
      .map((e) => ({ ...e, registrations: counts[e.id] || 0, registered: mine.has(e.id) }))
      .sort((a, b) => a.date.localeCompare(b.date))
  );
};

exports.createEvent = async (req, res) => {
  const data = { ...req.body, createdBy: req.user.uid, createdAt: now() };
  const ref = await db.collection('events').add(data);
  res.status(201).json({ id: ref.id, ...data });
};

exports.updateEvent = async (req, res) => {
  const existing = await getOne('events', req.params.id);
  if (!existing) throw new ApiError(404, 'Event not found');
  const updates = { ...req.body, updatedAt: now() };
  await db.collection('events').doc(req.params.id).update(updates);
  res.json({ ...existing, ...updates });
};

exports.deleteEvent = async (req, res) => {
  const existing = await getOne('events', req.params.id);
  if (!existing) throw new ApiError(404, 'Event not found');
  const regs = await list('eventRegistrations', [['eventId', '==', req.params.id]]);
  await Promise.all(regs.map((r) => db.collection('eventRegistrations').doc(r.id).delete()));
  await db.collection('events').doc(req.params.id).delete();
  res.json({ message: 'Event deleted' });
};

exports.registerForEvent = async (req, res) => {
  const event = await getOne('events', req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (new Date(event.date) < new Date()) throw new ApiError(400, 'Registration closed: event already happened');
  const id = `${event.id}_${req.user.uid}`;
  const ref = db.collection('eventRegistrations').doc(id);
  if ((await ref.get()).exists) throw new ApiError(409, 'You are already registered for this event');
  const data = {
    eventId: event.id, eventTitle: event.title, studentId: req.user.uid,
    studentName: req.user.name, studentRoll: req.user.studentId || '', registeredAt: now(),
  };
  await ref.set(data);
  res.status(201).json({ id, ...data });
};

exports.cancelRegistration = async (req, res) => {
  const ref = db.collection('eventRegistrations').doc(`${req.params.id}_${req.user.uid}`);
  if (!(await ref.get()).exists) throw new ApiError(404, 'Registration not found');
  await ref.delete();
  res.json({ message: 'Registration cancelled' });
};

exports.eventRegistrations = async (req, res) => {
  res.json(await list('eventRegistrations', [['eventId', '==', req.params.id]]));
};