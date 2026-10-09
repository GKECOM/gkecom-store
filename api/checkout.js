const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    const { cart } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Panier vide ou invalide' });
    }
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name, images: item.img ? [item.img] : [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping_options = subtotal >= 50
      ? [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 0, currency: 'eur' }, display_name: 'Livraison offerte' } }]
      : [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 590, currency: 'eur' }, display_name: 'Livraison standard' } }];
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      shipping_options,
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Erreur Stripe:', err);
    return res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
};
