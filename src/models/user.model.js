module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    fullName: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
      validate: {
        len: [2, 255]
      }
    },
    phone: { 
      type: DataTypes.STRING(255), 
      unique: true, 
      allowNull: false
    },
    email: { 
      type: DataTypes.STRING(255), 
      unique: true, 
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    // Role system matching current database
    role: { 
      type: DataTypes.ENUM('member', 'admin'), 
      defaultValue: 'member' 
    }
  }, {
    timestamps: true,
    tableName: 'users'
  });

  // Instance methods
  User.prototype.toSafeObject = function() {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
  };

  return User;
};
