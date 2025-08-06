const Loan = require('../models/loan.model');
const User = require('../models/user.model');
const Group = require('../models/group.model');

/**
 * Request a new loan (FR7)
 */
exports.requestLoan = async (req, res) => {
  try {
    const {
      amount,
      purpose,
      groupId,
      interestRate
    } = req.body;

    // Validate required fields
    if (!amount || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Amount and purpose are required'
      });
    }

    // Calculate due date (default 1 month)
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);

    const loan = await Loan.create({
      userId: req.user?.id || null,
      groupId: groupId || null,
      amount,
      purpose,
      interestRate: interestRate || 5.00,
      dueDate,
      status: 'pending',
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null
    });

    res.status(201).json({
      success: true,
      message: 'Loan request submitted successfully',
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting loan request',
      error: error.message
    });
  }
};

/**
 * Get all loans
 */
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { deletedAt: null }
    });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching loans',
      error: error.message
    });
  }
};

/**
 * Approve loan
 */
exports.approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findOne({
      where: {
        id: loanId,
        deletedAt: null
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    await loan.update({
      status: 'approved',
      updatedBy: req.user?.id || null
    });

    res.json({
      success: true,
      message: 'Loan approved successfully',
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving loan',
      error: error.message
    });
  }
};

/**
 * Record loan repayment
 */
exports.repayLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }

    const loan = await Loan.findOne({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Update loan status to partially paid or fully paid
    await loan.update({
      status: 'partially_paid',
      updatedBy: req.user?.id || null
    });

    res.json({
      success: true,
      message: 'Loan repayment recorded successfully',
      data: { loan, repaymentAmount: amount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording loan repayment',
      error: error.message
    });
  }
};

/**
 * Request a new loan (FR7)
 * Required permissions: create_loan
 */
exports.requestLoan = async (req, res) => {
  try {
    const {
      amount,
      purpose,
      purposeCategory,
      groupId,
      repaymentTerm,
      repaymentFrequency,
      interestRate
    } = req.body;

    // Validate required fields
    if (!amount || !purpose || !groupId || !repaymentTerm) {
      return res.status(400).json({
        success: false,
        message: 'Amount, purpose, group ID, and repayment term are required'
      });
    }

    // Validate loan amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Loan amount must be greater than 0'
      });
    }

    // Check if user is member of the group
    const userGroup = await UserGroup.findOne({
      where: {
        userId: req.user.id,
        groupId,
        status: 'active'
      }
    });

    if (!userGroup) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Get group information
    const group = await Group.findOne({
      where: {
        id: groupId,
        status: 'active',
        deletedAt: null
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or inactive'
      });
    }

    // Check if loan amount exceeds group limit
    if (group.maxLoanAmount && amount > group.maxLoanAmount) {
      return res.status(400).json({
        success: false,
        message: `Loan amount exceeds group maximum of ${group.maxLoanAmount} RWF`
      });
    }

    // Check if user has outstanding loans
    const outstandingLoans = await Loan.count({
      where: {
        userId: req.user.id,
        status: { [Op.in]: ['approved', 'disbursed', 'partially_paid'] },
        deletedAt: null
      }
    });

    if (outstandingLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have outstanding loans. Please repay existing loans before requesting new ones.'
      });
    }

    // Calculate loan details
    const loanInterestRate = interestRate || group.defaultInterestRate || 5.00;
    const totalInterest = (amount * loanInterestRate * repaymentTerm) / 100;
    const totalAmount = amount + totalInterest;
    
    // Calculate payment frequency multiplier
    const frequencyMultiplier = repaymentFrequency === 'weekly' ? 4 : 
                               repaymentFrequency === 'biweekly' ? 2 : 1;
    const totalPayments = repaymentTerm * frequencyMultiplier;
    const monthlyPayment = totalAmount / totalPayments;

    // Calculate first payment date
    const firstPaymentDate = new Date();
    if (repaymentFrequency === 'weekly') {
      firstPaymentDate.setDate(firstPaymentDate.getDate() + 7);
    } else if (repaymentFrequency === 'biweekly') {
      firstPaymentDate.setDate(firstPaymentDate.getDate() + 14);
    } else {
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + repaymentTerm);

    const loan = await Loan.create({
      userId: req.user.id,
      groupId,
      amount,
      purpose,
      purposeCategory: purposeCategory || 'other',
      interestRate: loanInterestRate,
      repaymentTerm,
      repaymentFrequency: repaymentFrequency || 'monthly',
      totalInterest,
      totalAmount,
      monthlyPayment,
      firstPaymentDate,
      dueDate,
      outstandingBalance: totalAmount,
      status: 'pending',
      submittedAt: new Date(),
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await auditLogger.log(
      req.user.id,
      'request',
      'loan',
      loan.id,
      req.ip,
      req.get('User-Agent'),
      {
        amount,
        purpose,
        groupId,
        groupName: group.name
      }
    );

    res.status(201).json({
      success: true,
      message: 'Loan request submitted successfully',
      data: loan
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'request',
      'loan',
      null,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error submitting loan request',
      error: error.message
    });
  }
};

/**
 * Get all loans with filtering and pagination (FR8)
 * Required permissions: view_loans
 */
exports.getAllLoans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      groupId,
      userId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { deletedAt: null };

    // Apply filters
    if (status) {
      whereClause.status = status;
    }

    if (groupId) {
      whereClause.groupId = groupId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (search) {
      whereClause[Op.or] = [
        { purpose: { [Op.like]: `%${search}%` } },
        { purposeCategory: { [Op.like]: `%${search}%` } }
      ];
    }

    // Apply role-based filtering
    if (req.user.role === 'member') {
      // Members can only see their own loans
      whereClause.userId = req.user.id;
    } else if (req.user.role === 'leader' || req.user.role === 'treasurer') {
      // Leaders and treasurers can see loans from their groups
      const userGroups = await UserGroup.findAll({
        where: {
          userId: req.user.id,
          role: { [Op.in]: ['leader', 'treasurer'] },
          status: 'active'
        },
        attributes: ['groupId']
      });
      
      const groupIds = userGroups.map(ug => ug.groupId);
      if (groupIds.length > 0) {
        whereClause.groupId = { [Op.in]: groupIds };
      } else {
        whereClause.userId = req.user.id; // Fallback to own loans
      }
    }
    // Admins and auditors can see all loans (no additional filter)

    const { count, rows: loans } = await Loan.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'location']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: loans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching loans',
      error: error.message
    });
  }
};

/**
 * Get loan by ID with details (FR8)
 * Required permissions: view_loan
 */
exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findOne({
      where: {
        id,
        deletedAt: null
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'nationalId']
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'location', 'defaultInterestRate']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'disburser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'member' && loan.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this loan'
      });
    }

    // Get repayment history
    const repayments = await Repayment.findAll({
      where: {
        loanId: id,
        deletedAt: null
      },
      include: [
        {
          model: User,
          as: 'recordedByUser',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate payment schedule
    const paymentSchedule = [];
    const startDate = new Date(loan.firstPaymentDate);
    const frequencyDays = loan.repaymentFrequency === 'weekly' ? 7 :
                         loan.repaymentFrequency === 'biweekly' ? 14 : 30;
    
    const frequencyMultiplier = loan.repaymentFrequency === 'weekly' ? 4 :
                               loan.repaymentFrequency === 'biweekly' ? 2 : 1;
    const totalPayments = loan.repaymentTerm * frequencyMultiplier;

    for (let i = 0; i < totalPayments; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(startDate.getDate() + (i * frequencyDays));
      
      paymentSchedule.push({
        paymentNumber: i + 1,
        dueDate: paymentDate,
        amount: loan.monthlyPayment,
        status: paymentDate < new Date() ? 'overdue' : 'pending'
      });
    }

    res.json({
      success: true,
      data: {
        ...loan.toJSON(),
        repayments,
        paymentSchedule
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching loan details',
      error: error.message
    });
  }
};

/**
 * Review loan application (FR9)
 * Required permissions: review_loan
 */
exports.reviewLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    const loan = await Loan.findOne({
      where: {
        id,
        status: 'pending',
        deletedAt: null
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found or not in pending status'
      });
    }

    const updateData = {
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
      updatedBy: req.user.id
    };

    if (action === 'approve') {
      updateData.status = 'under_review';
    } else {
      updateData.status = 'rejected';
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = comments;
    }

    await loan.update(updateData);

    await auditLogger.log(
      req.user.id,
      'review',
      'loan',
      id,
      req.ip,
      req.get('User-Agent'),
      {
        action,
        comments,
        loanAmount: loan.amount,
        borrowerId: loan.userId
      }
    );

    res.json({
      success: true,
      message: `Loan ${action}d successfully`,
      data: loan
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'review',
      'loan',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error reviewing loan',
      error: error.message
    });
  }
};

/**
 * Approve/Reject loan (FR9)
 * Required permissions: approve_loan
 */
exports.approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { action, comments } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    const loan = await Loan.findOne({
      where: {
        id: loanId,
        status: 'under_review',
        deletedAt: null
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found or not under review'
      });
    }

    const updateData = {
      approvedAt: new Date(),
      approvedBy: req.user.id,
      updatedBy: req.user.id
    };

    if (action === 'approve') {
      updateData.status = 'approved';
    } else {
      updateData.status = 'rejected';
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = comments;
    }

    await loan.update(updateData);

    await auditLogger.log(
      req.user.id,
      'approve',
      'loan',
      loanId,
      req.ip,
      req.get('User-Agent'),
      {
        action,
        comments,
        loanAmount: loan.amount,
        borrowerId: loan.userId
      }
    );

    res.json({
      success: true,
      message: `Loan ${action}d successfully`,
      data: loan
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'approve',
      'loan',
      req.params.loanId,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error approving/rejecting loan',
      error: error.message
    });
  }
};

/**
 * Disburse approved loan (FR10)
 * Required permissions: disburse_loan
 */
exports.disburseLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      disbursementMethod,
      disbursementReference,
      notes
    } = req.body;

    if (!disbursementMethod) {
      return res.status(400).json({
        success: false,
        message: 'Disbursement method is required'
      });
    }

    const loan = await Loan.findOne({
      where: {
        id,
        status: 'approved',
        deletedAt: null
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found or not approved for disbursement'
      });
    }

    await loan.update({
      status: 'disbursed',
      disbursedAt: new Date(),
      disbursedBy: req.user.id,
      disbursementMethod,
      disbursementReference,
      updatedBy: req.user.id
    });

    await auditLogger.log(
      req.user.id,
      'disburse',
      'loan',
      id,
      req.ip,
      req.get('User-Agent'),
      {
        disbursementMethod,
        disbursementReference,
        loanAmount: loan.amount,
        borrowerId: loan.userId,
        notes
      }
    );

    res.json({
      success: true,
      message: 'Loan disbursed successfully',
      data: loan
    });
  } catch (error) {
    await auditLogger.log(
      req.user.id,
      'disburse',
      'loan',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error disbursing loan',
      error: error.message
    });
  }
};

/**
 * Record loan repayment (FR11, FR12)
 * Required permissions: record_repayment
 */
exports.repayLoan = async (req, res) => {
  const transaction = await db.transaction();

  try {
    const { id } = req.params;
    const {
      amount,
      paymentMethod,
      paymentReference,
      notes
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }

    const loan = await Loan.findOne({
      where: {
        id,
        status: { [Op.in]: ['disbursed', 'partially_paid'] },
        deletedAt: null
      },
      transaction
    });

    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Loan not found or not eligible for repayment'
      });
    }

    if (amount > loan.outstandingBalance) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds outstanding balance of ${loan.outstandingBalance} RWF`
      });
    }

    // Record repayment
    const repayment = await Repayment.create({
      loanId: id,
      amount,
      paymentMethod: paymentMethod || 'cash',
      paymentReference,
      notes,
      recordedBy: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    }, { transaction });

    // Update loan balance and status
    const newOutstandingBalance = loan.outstandingBalance - amount;
    const newTotalPaid = loan.totalPaid + amount;
    const newStatus = newOutstandingBalance <= 0 ? 'fully_paid' : 'partially_paid';

    await loan.update({
      outstandingBalance: newOutstandingBalance,
      totalPaid: newTotalPaid,
      status: newStatus,
      updatedBy: req.user.id
    }, { transaction });

    await auditLogger.log(
      req.user.id,
      'repay',
      'loan',
      id,
      req.ip,
      req.get('User-Agent'),
      {
        repaymentAmount: amount,
        paymentMethod,
        paymentReference,
        newOutstandingBalance,
        loanStatus: newStatus,
        borrowerId: loan.userId
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Loan repayment recorded successfully',
      data: {
        repayment,
        loan: {
          id: loan.id,
          outstandingBalance: newOutstandingBalance,
          totalPaid: newTotalPaid,
          status: newStatus
        }
      }
    });
  } catch (error) {
    await transaction.rollback();

    await auditLogger.log(
      req.user.id,
      'repay',
      'loan',
      req.params.id,
      req.ip,
      req.get('User-Agent'),
      { error: error.message },
      false
    );

    res.status(500).json({
      success: false,
      message: 'Error recording loan repayment',
      error: error.message
    });
  }
};

/**
 * Get loan repayment history
 * Required permissions: view_repayments
 */
exports.getLoanRepayments = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Check if loan exists and user has access
    const loan = await Loan.findOne({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'member' && loan.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this loan'
      });
    }

    const { count, rows: repayments } = await Repayment.findAndCountAll({
      where: {
        loanId: id,
        deletedAt: null
      },
      include: [
        {
          model: User,
          as: 'recordedByUser',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: repayments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching loan repayments',
      error: error.message
    });
  }
};