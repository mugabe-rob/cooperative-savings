module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define('Loan', {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    amount: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    // Loan purpose as per URS FR10
    purpose: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    purposeCategory: {
      type: DataTypes.ENUM('business', 'education', 'health', 'agriculture', 'emergency', 'other'),
      allowNull: false
    },
    // Interest and terms
    interestRate: { 
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: false,
      validate: {
        min: 0,
        max: 50 // Max 50% as per typical VSLA rules
      }
    },
    repaymentTerm: {
      type: DataTypes.INTEGER, // Number of payment periods
      allowNull: false,
      validate: {
        min: 1,
        max: 24 // Max 24 periods
      }
    },
    repaymentFrequency: {
      type: DataTypes.ENUM('weekly', 'biweekly', 'monthly'),
      defaultValue: 'weekly'
    },
    // Enhanced status with approval workflow
    status: { 
      type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'disbursed', 'partially_paid', 'fully_paid', 'defaulted'), 
      defaultValue: 'pending' 
    },
    // Approval workflow fields
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Disbursement tracking
    disbursedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    disbursedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    disbursementMethod: {
      type: DataTypes.ENUM('cash', 'mobile_money', 'bank_transfer'),
      allowNull: true
    },
    disbursementReference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // Dates
    issuedDate: { 
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    dueDate: { 
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    firstPaymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // Calculated fields
    totalInterest: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    monthlyPayment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    outstandingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    totalPaid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    // Foreign keys
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      }
    },
    // Audit fields
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    timestamps: true,
    paranoid: true,
    tableName: 'loans',
    hooks: {
      beforeCreate: (loan) => {
        // Calculate total interest and amount
        const principal = parseFloat(loan.amount);
        const rate = parseFloat(loan.interestRate) / 100;
        const term = parseInt(loan.repaymentTerm);
        
        loan.totalInterest = (principal * rate * term / 12).toFixed(2);
        loan.totalAmount = (principal + parseFloat(loan.totalInterest)).toFixed(2);
        loan.monthlyPayment = (parseFloat(loan.totalAmount) / term).toFixed(2);
        loan.outstandingBalance = loan.totalAmount;
      }
    }
  });

  // Instance methods
  Loan.prototype.approve = async function(approvedBy) {
    this.status = 'approved';
    this.approvedAt = new Date();
    this.approvedBy = approvedBy;
    this.reviewedAt = new Date();
    this.reviewedBy = approvedBy;
    await this.save();
  };

  Loan.prototype.reject = async function(rejectedBy, reason) {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    this.reviewedAt = new Date();
    this.reviewedBy = rejectedBy;
    await this.save();
  };

  Loan.prototype.disburse = async function(disbursedBy, method, reference) {
    this.status = 'disbursed';
    this.disbursedAt = new Date();
    this.disbursedBy = disbursedBy;
    this.disbursementMethod = method;
    this.disbursementReference = reference;
    this.issuedDate = new Date();
    
    // Calculate due date based on repayment term
    const dueDate = new Date();
    if (this.repaymentFrequency === 'weekly') {
      dueDate.setDate(dueDate.getDate() + (this.repaymentTerm * 7));
    } else if (this.repaymentFrequency === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + this.repaymentTerm);
    }
    this.dueDate = dueDate;
    
    await this.save();
  };

  return Loan;
};
