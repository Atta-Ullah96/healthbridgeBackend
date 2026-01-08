import { LabPayout } from "../../models/admin/labpayout.js";
import { Laboratory } from "../../models/laboartory/labartory.js";
import { LabTest } from "../../models/laboartory/labtest.js";
import {   Order } from "../../models/laboartory/order.js";
import { Technician } from "../../models/laboartory/technician.js";
import Session from "../../models/session.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


export const laboratoryLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const lab = await Laboratory.findOne({ email });
    if (!lab) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!lab.isActive) {
      return res.status(403).json({
        message: "Your laboratory account is deactivated. Contact admin."
      });
    }

    const isMatch = await lab.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const session = await Session.create({
      userId: lab._id,
      role: "laboratory"
    });

    res.cookie("sessionId", session._id, {
      httpOnly: true,
      sameSite: "strict"
    });

    res.status(200).json({
      success: true,
      message: "Laboratory logged in successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};



// ************************************* lab owner login finish here **************************** //


// ********************* overview     api's  start here  ****************** // 

export const labDashboardOverview = async (req, res) => {
  try {
    const labId = req.userId;

    // Counts
    const totalOrders = await Order.countDocuments({ labId });

    const pendingOrders = await Order.countDocuments({
      labId,
      status: "pending",
    });

    const inProgressOrders = await Order.countDocuments({
      labId,
      status: "in_progress",
    });

    const completedOrders = await Order.countDocuments({
      labId,
      status: "completed",
    });

    // 🔹 Revenue calculation
    const revenueResult = await Order.aggregate([
      {
        $match: {
          labId: labId,
          status: "completed",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Recent orders
    const recentOrders = await Order.find({ labId })
      .populate("patientId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ********************* overview    api's  end here  ****************** // 


export const createLabOrder = async (req, res) => {
  const { laboratoryId, testIds } = req.body;
  const patientId = req.userId;

  // 1️⃣ Fetch tests from DB
  const tests = await LabTest.find({
    _id: { $in: testIds },
    laboratoryId,
    isActive: true
  });

  if (!tests.length) {
    return res.status(400).json({ message: "Invalid tests" });
  }

  // 2️⃣ Calculate total
  let totalAmount = 0;
  const testData = tests.map(test => {
    totalAmount += test.price;
    return { testId: test._id, price: test.price };
  });

  // 3️⃣ Check existing unpaid order
  let order = await Order.findOne({
    patientId,
    laboratoryId,
    paymentStatus: "pending"
  });

  if (order?.checkoutSessionId) {
    return res.json({
      checkoutUrl: `https://checkout.stripe.com/pay/${order.checkoutSessionId}`
    });
  }

  // 4️⃣ Create order
  order = await Order.create({
    patientId,
    laboratoryId,
    tests: testData,
    totalAmount
  });

  // 5️⃣ Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: testData.map(t => ({
      price_data: {
        currency: "pkr",
        product_data: { name: "Lab Test" },
        unit_amount: t.price * 100
      },
      quantity: 1
    })),
    success_url: `https://healthbridge.space`,
    cancel_url: `https://healthbridge.space`,
    metadata: {
      orderId: order._id.toString()
    }
  });

  order.checkoutSessionId = session.id;
  await order.save();

  res.status(201).json({ checkoutUrl: session.url });
};




// ***************************** webhook api of lab *********************** //
export const labStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    const order = await Order.findById(orderId);
    if (!order || order.paymentStatus === "paid") return res.sendStatus(200);

    // Commission
    const commissionRate = 0.1;
    order.platformCommission = order.totalAmount * commissionRate;
    order.labEarning = order.totalAmount - order.platformCommission;

    order.paymentStatus = "paid";
    order.paymentIntentId = session.payment_intent;

    await order.save();

      await LabPayout.create({
    labId: order.laboratoryId,
    orderId: order._id,
    amount: order.labEarning,
    status: "pending",
  });
  }

  res.json({ received: true });
};





export const getLabOrders = async (req, res) => {
  const laboratoryId = req.userId;

  const orders = await Order.find({ laboratoryId })
    .populate("patientId", "fullName phone")
   
    .sort({ createdAt: -1 });

  res.json(orders);
};


// "pending", "sample_collected", "processing", "completed", "cancelled" //

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    laboratoryId: req.userId
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.orderStatus = status;
  await order.save();

  res.json({ message: "Order updated" });
};



export const deleteCompletedOrder = async (req, res) => {
  const { orderId } = req.params;
  const laboratoryId = req.lab._id;

  const order = await Order.findOne({
    _id: orderId,
    laboratoryId
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // 🔒 Strict checks
  if (
    order.orderStatus !== "completed" ||
    order.paymentStatus !== "paid"
  ) {
    return res.status(400).json({
      message: "Only completed & paid orders can be removed"
    });
  }

  order.isDeletedByLab = true;
  await order.save();

  res.json({ message: "Order removed from lab dashboard" });
};

// ********************* orders controller end's here  ****************** // 


// ********************* lab test controller start here  ****************** // 
//POST /api/v1/lab/tests
export const createLabTest = async (req, res) => {
  const labId = req.userId; // lab owner

  const test = await LabTest.create({
    labId,
    ...req.body,
  });

  res.status(201).json({ success: true, test });
};


//GET /api/v1/lab/tests
export const getMyLabTests = async (req, res) => {
  const labId = req.userId;

  const tests = await LabTest.find({ labId });

  res.json({ success: true, tests });
};


// PUT /api/v1/lab/tests/:id

export const updateLabTest = asyncHandler(async(req,res,next) =>{

  const labtest = await LabTest.findOneAndUpdate(
  { _id: req.params.id, labId: req.userId },
  req.body,
  { new: true }
);

res.status(201).json({success:true , labtest})

})

// DELETE /api/v1/lab/tests/:id

export const deleteLabTest = asyncHandler(async(req ,res,next) =>{
  await LabTest.findOneAndDelete({
  _id: req.params.id,
  labId: req.userId,
});

res.status(201).json({success:true , message : 'lab test deleted successfully'
})

})


// patient can publicaaly access this api of lab GET /api/v1/tests
export const getAllLabTests = async (req, res) => {
  const tests = await LabTest.find({ isActive: true })
    .populate("labId", "labName location");

  res.json({ success: true, tests });
};



// ********************* lab test  controller  end here  ****************** //

// ********************* Technician controller start from here  ****************** // 


export const createTechnician = async (req, res) => {
  try {
    const { name, email, phone, laboratoryId } = req.body;

    const existingTech = await Technician.findOne({ email });
    if (existingTech) {
      return res.status(400).json({ message: "Technician already exists" });
    }
    
    const technician = await Technician.create({ name, email, phone, laboratoryId });
    res.status(201).json({ message: "Technician created", technician });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getAllTechnicians = async (req, res) => {
  try {
    const { laboratoryId, page = 1, limit = 10, search = "" } = req.query;
    const query = {
      laboratoryId,
      name: { $regex: search, $options: "i" },
    };
    
    const technicians = await Technician.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Technician.countDocuments(query);

    res.json({ technicians, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const updateTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const technician = await Technician.findByIdAndUpdate(id, updates, { new: true });
    if (!technician) return res.status(404).json({ message: "Technician not found" });
    
    res.json({ message: "Technician updated", technician });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const technician = await Technician.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!technician) return res.status(404).json({ message: "Technician not found" });

    res.json({ message: "Technician deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ********************* Technician controller end here  ****************** // 

// ********************* payoutt controller   start here  ****************** // 

export const getMyLabPayouts = async (req, res) => {
  try {
    const labId = req.userId; // from auth middleware

    const payouts = await LabPayout.find({ labId })
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payouts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ********************* payout   api's  end here  ****************** // 



