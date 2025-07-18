// Advanced WordPress Pro Mastery Discord Bot - CORRECTED VERSION
// Features: Verification System, Plan Selection, Security, Easy Management

require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ChannelType, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

// Security and management configuration
const securityConfig = {
    maxVerificationAttempts: 3,
    cooldownPeriod: 300000, // 5 minutes
    autoKickUnverified: 600000, // 10 minutes
    rateLimitMessages: 5,
    rateLimitWindow: 60000, // 1 minute
};

// In-memory storage for verification attempts and user data
const verificationAttempts = new Map();
const userCooldowns = new Map();
const pendingVerifications = new Map();
const messageRateLimits = new Map();
const pendingPayments = new Map();
const subscriptionData = new Map();
const paymentHistory = new Map();

// WordPress Pro Mastery Server Configuration
const serverConfig = {
    // Customer subscription roles with detailed info
    roles: [
        {
            name: 'WordPress Master',
            color: 0xFFD700,
            permissions: [PermissionFlagsBits.Administrator],
            hoist: true,
            mentionable: true,
            description: 'Server administrator and WordPress expert',
            emoji: '👑'
        },
        {
            name: 'Pro Optimizer',
            color: 0x9D4EDD,
            permissions: [],
            hoist: true,
            mentionable: false,
            description: 'Premium tier - 1,200 DH/month - Weekly 1-on-1 coaching',
            emoji: '🥇',
            price: '1,200 DH/month'
        },
        {
            name: 'Speed Specialist',
            color: 0x0EA5E9,
            permissions: [],
            hoist: true,
            mentionable: false,
            description: 'Mid tier - 600 DH/month - Bi-weekly coaching calls',
            emoji: '🥈',
            price: '600 DH/month'
        },
        {
            name: 'WordPress Learner',
            color: 0x10B981,
            permissions: [],
            hoist: true,
            mentionable: false,
            description: 'Entry tier - 300 DH/month - Group Q&A and support',
            emoji: '🥉',
            price: '300 DH/month'
        },
        {
            name: 'Free Member',
            color: 0x6B7280,
            permissions: [],
            hoist: false,
            mentionable: false,
            description: 'Free access - Read-only to see value',
            emoji: '🆓',
            price: 'Free'
        },
        {
            name: 'Unverified',
            color: 0x000000,
            permissions: [],
            hoist: false,
            mentionable: false,
            description: 'Temporary role for new members',
            emoji: '❓'
        }
    ],

    // Enhanced channel structure
    categories: [
        {
            name: '🔐 VERIFICATION CENTER',
            channels: [
                {
                    name: '📋-server-rules',
                    type: ChannelType.GuildText,
                    permissions: 'public_readonly',
                    description: 'Server rules and community guidelines'
                },
                {
                    name: '✅-verification',
                    type: ChannelType.GuildText,
                    permissions: 'verification_only',
                    description: 'Complete verification and select your plan'
                },
                {
                    name: '🎯-plan-selection',
                    type: ChannelType.GuildText,
                    permissions: 'verification_only',
                    description: 'Choose your membership tier'
                },
                {
                    name: '💳-payment-info',
                    type: ChannelType.GuildText,
                    permissions: 'verification_only',
                    description: 'Payment instructions for paid tiers'
                },
                {
                    name: '📸-payment-proof',
                    type: ChannelType.GuildText,
                    permissions: 'verification_only',
                    description: 'Upload payment screenshots for verification'
                },
                {
                    name: '⏳-pending-approval',
                    type: ChannelType.GuildText,
                    permissions: 'verification_only',
                    description: 'Waiting for payment approval'
                }
            ]
        },
        {
            name: '🏠 WELCOME CENTER',
            channels: [
                {
                    name: '👋-introduce-yourself',
                    type: ChannelType.GuildText,
                    permissions: 'everyone',
                    description: 'Tell us about yourself and your WordPress goals'
                },
                {
                    name: '📢-announcements',
                    type: ChannelType.GuildText,
                    permissions: 'announcement',
                    description: 'Important updates and community news'
                },
                {
                    name: '🎉-member-milestones',
                    type: ChannelType.GuildText,
                    permissions: 'everyone',
                    description: 'Celebrate member achievements and milestones'
                }
            ]
        },
        {
            name: '🔧 WORDPRESS HELP',
            channels: [
                {
                    name: '🆘-urgent-emergencies',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'EMERGENCY ONLY - Site completely down or hacked'
                },
                {
                    name: '🔧-general-help',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'General WordPress questions and troubleshooting'
                },
                {
                    name: '🛡️-security-issues',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'Security concerns and malware issues'
                },
                {
                    name: '⚡-speed-optimization',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'Site speed optimization and Core Web Vitals'
                }
            ]
        },
        {
            name: '🛒 WOOCOMMERCE ZONE',
            channels: [
                {
                    name: '🛒-store-optimization',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'WooCommerce optimization and troubleshooting'
                },
                {
                    name: '💳-payment-gateways',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'Payment gateway setup and issues'
                },
                {
                    name: '📦-inventory-shipping',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'Inventory management and shipping configuration'
                }
            ]
        },
        {
            name: '📈 BUSINESS GROWTH',
            channels: [
                {
                    name: '🔍-seo-strategies',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'SEO optimization and search ranking strategies'
                },
                {
                    name: '💰-monetization',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'Monetize your WordPress skills and knowledge'
                },
                {
                    name: '📊-analytics-tracking',
                    type: ChannelType.GuildText,
                    permissions: 'paid_only',
                    description: 'Website analytics and performance tracking'
                }
            ]
        },
        {
            name: '🔒 PREMIUM COACHING',
            channels: [
                {
                    name: '🥉-learner-lounge',
                    type: ChannelType.GuildText,
                    permissions: 'learner_plus',
                    description: 'Exclusive space for WordPress Learner tier'
                },
                {
                    name: '🥈-specialist-zone',
                    type: ChannelType.GuildText,
                    permissions: 'specialist_plus',
                    description: 'Advanced discussions for Speed Specialist tier'
                },
                {
                    name: '🥇-pro-mastermind',
                    type: ChannelType.GuildText,
                    permissions: 'pro_only',
                    description: 'Elite mastermind for Pro Optimizer tier'
                },
                {
                    name: '🎥-coaching-library',
                    type: ChannelType.GuildText,
                    permissions: 'paid_readonly',
                    description: 'Coaching session recordings and resources'
                }
            ]
        },
        {
            name: '🛠️ ADMIN TOOLS',
            channels: [
                {
                    name: '📊-server-stats',
                    type: ChannelType.GuildText,
                    permissions: 'admin_only',
                    description: 'Server statistics and analytics'
                },
                {
                    name: '🚨-moderation-log',
                    type: ChannelType.GuildText,
                    permissions: 'admin_only',
                    description: 'Moderation actions and security alerts'
                },
                {
                    name: '💼-member-management',
                    type: ChannelType.GuildText,
                    permissions: 'admin_only',
                    description: 'Member verification and role management'
                },
                {
                    name: '💰-payment-approvals',
                    type: ChannelType.GuildText,
                    permissions: 'admin_only',
                    description: 'Review and approve payment screenshots'
                },
                {
                    name: '📊-revenue-dashboard',
                    type: ChannelType.GuildText,
                    permissions: 'admin_only',
                    description: 'Real-time revenue tracking and analytics'
                }
            ]
        }
    ],

    // Voice channels - FIXED: Removed topic descriptions
    voiceChannels: [
        {
            name: '🎤 Weekly Q&A Sessions',
            permissions: 'group_voice'
        },
        {
            name: '🔧 Emergency Support',
            permissions: 'paid_voice'
        },
        {
            name: '🎓 Specialist Coaching',
            permissions: 'specialist_voice'
        },
        {
            name: '👑 Pro Optimizer VIP',
            permissions: 'pro_voice'
        },
        {
            name: '🏢 Admin Conference',
            permissions: 'admin_voice'
        }
    ]
};

// Enhanced permission system
function getPermissionOverwrites(guild, permissionType) {
    const roles = {
        everyone: guild.roles.everyone,
        unverified: guild.roles.cache.find(r => r.name === 'Unverified'),
        freeMember: guild.roles.cache.find(r => r.name === 'Free Member'),
        learner: guild.roles.cache.find(r => r.name === 'WordPress Learner'),
        specialist: guild.roles.cache.find(r => r.name === 'Speed Specialist'),
        pro: guild.roles.cache.find(r => r.name === 'Pro Optimizer'),
        master: guild.roles.cache.find(r => r.name === 'WordPress Master')
    };

    const permissionSets = {
        // Public readable channels
        public_readonly: [
            {
                id: roles.everyone.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages]
            },
            {
                id: roles.master.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Verification channels - only unverified can use
        verification_only: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.unverified.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.master.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Everyone can post (after verification)
        everyone: [
            {
                id: roles.unverified.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.freeMember.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.learner.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Announcements - admin only
        announcement: [
            {
                id: roles.everyone.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages]
            },
            {
                id: roles.unverified.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.master.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Paid members only
        paid_only: [
            {
                id: roles.everyone.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages]
            },
            {
                id: roles.unverified.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.freeMember.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages]
            },
            {
                id: roles.learner.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Paid members read-only
        paid_readonly: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.learner.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages]
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages]
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages]
            },
            {
                id: roles.master.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Learner tier and above
        learner_plus: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.learner.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Specialist tier and above
        specialist_plus: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Pro tier only
        pro_only: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Admin only
        admin_only: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: roles.master.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
            }
        ],

        // Voice channel permissions
        group_voice: [
            {
                id: roles.everyone.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                deny: [PermissionFlagsBits.Speak, PermissionFlagsBits.Stream]
            },
            {
                id: roles.unverified.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
            },
            {
                id: roles.freeMember.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                deny: [PermissionFlagsBits.Speak, PermissionFlagsBits.Stream]
            },
            {
                id: roles.learner.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                deny: [PermissionFlagsBits.Stream]
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            }
        ],

        paid_voice: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
            },
            {
                id: roles.learner.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                deny: [PermissionFlagsBits.Stream]
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            }
        ],

        specialist_voice: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
            },
            {
                id: roles.specialist.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            }
        ],

        pro_voice: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
            },
            {
                id: roles.pro.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            }
        ],

        admin_voice: [
            {
                id: roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
            },
            {
                id: roles.master.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
                deny: []
            }
        ]
    };

    return permissionSets[permissionType] || [];
}

// Cleanup function to remove existing setup
async function cleanupExistingSetup(guild) {
    try {
        // Delete existing channels (except system channels)
        console.log(`   🗑️ Removing existing channels...`);
        const channelsToDelete = guild.channels.cache.filter(channel => {
            // Don't delete system channels or channels that might be important
            const systemChannels = ['general', 'rules', 'announcements'];
            const isSystemChannel = systemChannels.some(name => 
                channel.name.toLowerCase().includes(name) && 
                !channel.name.includes('📋-server-rules') &&
                !channel.name.includes('📢-announcements')
            );
            
            // Delete channels that match our setup pattern
            const isOurChannel = channel.name.includes('-') || 
                                channel.name.includes('🔐') || 
                                channel.name.includes('🏠') || 
                                channel.name.includes('🔧') || 
                                channel.name.includes('🛒') || 
                                channel.name.includes('📈') || 
                                channel.name.includes('🔒') || 
                                channel.name.includes('🛠️') ||
                                channel.name.includes('🎤') ||
                                channel.name.includes('👑') ||
                                channel.name.includes('🎓');
            
            return !isSystemChannel && isOurChannel;
        });

        for (const channel of channelsToDelete.values()) {
            try {
                await channel.delete();
                console.log(`      ❌ Deleted channel: ${channel.name}`);
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.log(`      ⚠️ Could not delete channel: ${channel.name}`);
            }
        }

        // Delete existing categories (except default ones)
        console.log(`   🗑️ Removing existing categories...`);
        const categoriesToDelete = guild.channels.cache.filter(channel => 
            channel.type === ChannelType.GuildCategory && (
                channel.name.includes('🔐') || 
                channel.name.includes('🏠') || 
                channel.name.includes('🔧') || 
                channel.name.includes('🛒') || 
                channel.name.includes('📈') || 
                channel.name.includes('🔒') || 
                channel.name.includes('🛠️')
            )
        );

        for (const category of categoriesToDelete.values()) {
            try {
                await category.delete();
                console.log(`      ❌ Deleted category: ${category.name}`);
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.log(`      ⚠️ Could not delete category: ${category.name}`);
            }
        }

        // Delete existing roles (except @everyone and bot roles)
        console.log(`   🗑️ Removing existing roles...`);
        const rolesToDelete = guild.roles.cache.filter(role => {
            const ourRoleNames = [
                'WordPress Master',
                'Pro Optimizer', 
                'Speed Specialist',
                'WordPress Learner',
                'Free Member',
                'Unverified'
            ];
            return ourRoleNames.includes(role.name) && !role.managed && role.name !== '@everyone';
        });

        for (const role of rolesToDelete.values()) {
            try {
                await role.delete();
                console.log(`      ❌ Deleted role: ${role.name}`);
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.log(`      ⚠️ Could not delete role: ${role.name}`);
            }
        }

        // Wait for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        console.error(`❌ Error during cleanup:`, error);
    }
}

// Security functions
function isRateLimited(userId) {
    const userRateLimit = messageRateLimits.get(userId);
    if (!userRateLimit) return false;

    const now = Date.now();
    const recentMessages = userRateLimit.filter(timestamp => now - timestamp < securityConfig.rateLimitWindow);
    
    if (recentMessages.length >= securityConfig.rateLimitMessages) {
        return true;
    }

    messageRateLimits.set(userId, recentMessages);
    return false;
}

function addMessageToRateLimit(userId) {
    const userRateLimit = messageRateLimits.get(userId) || [];
    userRateLimit.push(Date.now());
    messageRateLimits.set(userId, userRateLimit);
}

function isUserOnCooldown(userId) {
    const cooldown = userCooldowns.get(userId);
    if (!cooldown) return false;
    
    return Date.now() - cooldown < securityConfig.cooldownPeriod;
}

function setCooldown(userId) {
    userCooldowns.set(userId, Date.now());
}

// Create verification embed and buttons
function createVerificationEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('🔐 Welcome to WordPress Pro Mastery!')
        .setDescription(`
**🎯 Complete Your Verification**

To ensure our community remains high-quality and secure, please complete the verification process:

**Step 1**: Read our server rules
**Step 2**: Answer verification questions
**Step 3**: Select your membership tier
**Step 4**: Get access to our WordPress optimization community

**Why verify?**
• Protect against spam and low-quality members
• Ensure serious WordPress professionals only
• Maintain premium community standards
• Access tier-appropriate channels and resources

Click the button below to start your verification!
        `)
        .setColor(0x0099FF)
        .setFooter({ text: 'WordPress Pro Mastery - Professional WordPress Optimization Community' });

    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('start_verification')
                .setLabel('🚀 Start Verification')
                .setStyle(ButtonStyle.Primary)
        );

    return { embeds: [embed], components: [button] };
}

// Create plan selection embed and menu
function createPlanSelectionEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('💰 Select Your Membership Tier & Pay')
        .setDescription(`
**⚠️ PAYMENT REQUIRED BEFORE ACCESS ⚠️**

Choose your tier and complete payment to unlock full access:

**🆓 Free Member** - **Free**
• ❌ NO ACCESS to help channels
• ❌ NO coaching sessions
• ❌ NO community support
• Only verification and payment channels visible

**🥉 WordPress Learner** - **300 DH/month**
• ✅ Ask questions and get expert answers
• Weekly group Q&A sessions
• Access to optimization guides
• Community support network
• **PAYMENT REQUIRED**

**🥈 Speed Specialist** - **600 DH/month**
• Everything in Learner tier +
• Bi-weekly 30-minute 1-on-1 coaching calls
• Priority support and faster responses
• Advanced optimization tutorials
• **PAYMENT REQUIRED**
• Performance audit recommendations

**🥇 Pro Optimizer** - **1,200 DH/month**
• Everything in Speed Specialist +
• Weekly 45-minute personal coaching sessions
• Emergency WhatsApp/Telegram access
• Live screen-sharing optimization sessions
• Custom business optimization strategies
• Partnership opportunities
• **PAYMENT REQUIRED**

**🔥 SPECIAL: First month 50% OFF for early members!**
        `)
        .setColor(0xFF6B35)
        .setFooter({ text: '⚠️ Payment required within 24 hours or account will be removed' });

    const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_membership_tier')
                .setPlaceholder('Choose your membership tier')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🆓 Free Member')
                        .setDescription('Free - NO ACCESS to help channels')
                        .setValue('free_member')
                        .setEmoji('🆓'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🥉 WordPress Learner - 150 DH/month (50% OFF)')
                        .setDescription('Entry tier - PAYMENT REQUIRED')
                        .setValue('wordpress_learner')
                        .setEmoji('🥉'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🥈 Speed Specialist - 300 DH/month (50% OFF)')
                        .setDescription('Mid tier - PAYMENT REQUIRED')
                        .setValue('speed_specialist')
                        .setEmoji('🥈'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🥇 Pro Optimizer - 600 DH/month (50% OFF)')
                        .setDescription('Premium tier - PAYMENT REQUIRED')
                        .setValue('pro_optimizer')
                        .setEmoji('🥇')
                )
        );

    return { embeds: [embed], components: [selectMenu] };
}

// Create verification modal
function createVerificationModal() {
    const modal = new ModalBuilder()
        .setCustomId('verification_modal')
        .setTitle('WordPress Pro Mastery Verification');

    const websiteInput = new TextInputBuilder()
        .setCustomId('website_url')
        .setLabel('What is your website URL? (Optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://yourwebsite.com')
        .setRequired(false);

    const experienceInput = new TextInputBuilder()
        .setCustomId('wp_experience')
        .setLabel('Describe your WordPress experience')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('e.g., 2 years building WordPress sites, struggling with speed optimization...')
        .setRequired(true);

    const goalsInput = new TextInputBuilder()
        .setCustomId('optimization_goals')
        .setLabel('What are your main optimization goals?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('e.g., Improve site speed, fix security issues, optimize WooCommerce...')
        .setRequired(true);

    const challengesInput = new TextInputBuilder()
        .setCustomId('current_challenges')
        .setLabel('What WordPress challenges are you facing?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('e.g., Slow loading times, security vulnerabilities, low conversion rates...')
        .setRequired(true);

    const businessInput = new TextInputBuilder()
        .setCustomId('business_type')
        .setLabel('What type of business/project is this for?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., E-commerce store, blog, business website, agency...')
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(websiteInput);
    const secondActionRow = new ActionRowBuilder().addComponents(experienceInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(goalsInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(challengesInput);
    const fifthActionRow = new ActionRowBuilder().addComponents(businessInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

    return modal;
}

// Create payment instructions embed
function createPaymentInstructionsEmbed(tierName, price, userId) {
    const embed = new EmbedBuilder()
        .setTitle(`💳 Payment Instructions - ${tierName}`)
        .setDescription(`
**🎯 Your Selected Tier:** ${tierName}
**💰 Amount to Pay:** ${price}
**🔥 Special Offer:** 50% OFF first month!

**📱 PAYMENT METHODS:**

**1. 🏦 Bank Transfer (Recommended)**
• Bank: Attijariwafa Bank
• Account: 007 640 0001234567890
• Name: WordPress Pro Mastery
• Reference: WPM-${userId}

**2. 💳 PayPal**
• Email: payments@wordpresspro.ma
• Reference: WPM-${userId}

**3. 📱 Mobile Money**
• Orange Money: +212 6XX XXX XXX
• Inwi Money: +212 5XX XXX XXX
• Reference: WPM-${userId}

**⚠️ IMPORTANT STEPS:**
1. Make payment using ONE of the methods above
2. Take a CLEAR screenshot of payment confirmation
3. Upload screenshot in #📸-payment-proof
4. Wait for admin approval (usually within 2 hours)
5. Get instant access to all ${tierName} features!

**🕐 Payment Deadline:** 24 hours from now
**❌ Late Payment:** Account will be automatically removed
        `)
        .setColor(0x00FF00)
        .setFooter({ text: 'Questions? Contact admin immediately' });

    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`upload_payment_${userId}`)
                .setLabel('📸 Upload Payment Screenshot')
                .setStyle(ButtonStyle.Success)
        );

    return { embeds: [embed], components: [button] };
}

// Create payment approval embed for admins
function createPaymentApprovalEmbed(user, tierName, price, screenshotUrl) {
    const embed = new EmbedBuilder()
        .setTitle('💰 New Payment Submission')
        .setDescription(`
**👤 User:** ${user.tag}
**🆔 ID:** ${user.id}
**🎯 Tier:** ${tierName}
**💰 Amount:** ${price}
**📅 Submitted:** ${new Date().toLocaleString()}
        `)
        .setImage(screenshotUrl)
        .setColor(0xFFAA00)
        .setFooter({ text: 'Review payment and approve/reject below' });

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`approve_payment_${user.id}`)
                .setLabel('✅ Approve Payment')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`reject_payment_${user.id}`)
                .setLabel('❌ Reject Payment')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`request_better_screenshot_${user.id}`)
                .setLabel('📸 Request Better Screenshot')
                .setStyle(ButtonStyle.Secondary)
        );

    return { embeds: [embed], components: [buttons] };
}

// Create subscription management embed
function createSubscriptionEmbed(user) {
    const subscription = subscriptionData.get(user.id);
    if (!subscription) return null;

    const nextPayment = new Date(subscription.nextPayment);
    const daysUntilPayment = Math.ceil((nextPayment - new Date()) / (1000 * 60 * 60 * 24));

    const embed = new EmbedBuilder()
        .setTitle('📊 Your Subscription Details')
        .setDescription(`
**👤 Member:** ${user.tag}
**🎯 Current Tier:** ${subscription.tier}
**💰 Monthly Price:** ${subscription.price}
**📅 Next Payment:** ${nextPayment.toLocaleDateString()}
**⏰ Days Until Payment:** ${daysUntilPayment} days
**✅ Status:** ${subscription.status}
**📈 Member Since:** ${new Date(subscription.startDate).toLocaleDateString()}
        `)
        .setColor(subscription.status === 'Active' ? 0x00FF00 : 0xFF0000)
        .setFooter({ text: 'Manage your subscription below' });

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`upgrade_subscription_${user.id}`)
                .setLabel('⬆️ Upgrade Tier')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`downgrade_subscription_${user.id}`)
                .setLabel('⬇️ Downgrade Tier')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`cancel_subscription_${user.id}`)
                .setLabel('❌ Cancel Subscription')
                .setStyle(ButtonStyle.Danger)
        );

    return { embeds: [embed], components: [buttons] };
}
// Main server setup function - CORRECTED
async function setupAdvancedWordPressServer(guild) {
    console.log(`\n🚀 Setting up Advanced WordPress Pro Mastery server: ${guild.name}`);
    console.log(`⏳ This will take 3-4 minutes to complete...\n`);

    try {
        // Step 0: Clean up existing setup to prevent duplicates
        console.log(`🧹 Cleaning up existing setup to prevent duplicates...`);
        await cleanupExistingSetup(guild);
        console.log(`   ✅ Cleanup completed\n`);

        // Step 1: Create enhanced role system
        console.log(`📋 Creating enhanced role system...`);
        for (const roleConfig of serverConfig.roles) {
            const existingRole = guild.roles.cache.find(r => r.name === roleConfig.name);
            if (!existingRole) {
                await guild.roles.create({
                    name: roleConfig.name,
                    color: roleConfig.color,
                    permissions: roleConfig.permissions,
                    hoist: roleConfig.hoist,
                    mentionable: roleConfig.mentionable
                });
                console.log(`   ✅ Created role: ${roleConfig.name}`);
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log(`   ⚠️  Role already exists: ${roleConfig.name}`);
            }
        }

        // Wait for roles to be fully created
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Create sophisticated channel structure
        console.log(`\n📁 Creating sophisticated channel structure...`);
        for (const categoryConfig of serverConfig.categories) {
            const category = await guild.channels.create({
                name: categoryConfig.name,
                type: ChannelType.GuildCategory
            });
            console.log(`   ✅ Created category: ${categoryConfig.name}`);

            for (const channelConfig of categoryConfig.channels) {
                const permissionOverwrites = getPermissionOverwrites(guild, channelConfig.permissions);
                
                await guild.channels.create({
                    name: channelConfig.name,
                    type: channelConfig.type,
                    parent: category.id,
                    topic: channelConfig.description,
                    permissionOverwrites: permissionOverwrites
                });
                console.log(`      ✅ Created channel: ${channelConfig.name}`);
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        }

        // Step 3: Create voice channels - FIXED: No topic field
        console.log(`\n🎤 Creating voice channels with enhanced permissions...`);
        for (const voiceConfig of serverConfig.voiceChannels) {
            const permissionOverwrites = getPermissionOverwrites(guild, voiceConfig.permissions);
            
            await guild.channels.create({
                name: voiceConfig.name,
                type: ChannelType.GuildVoice,
                permissionOverwrites: permissionOverwrites
            });
            console.log(`   ✅ Created voice channel: ${voiceConfig.name}`);
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Step 4: Set up verification system
        console.log(`\n🔐 Setting up verification system...`);
        const verificationChannel = guild.channels.cache.find(c => c.name === '✅-verification');
        if (verificationChannel) {
            await verificationChannel.send(createVerificationEmbed());
            console.log(`   ✅ Verification system deployed`);
        }

        const planSelectionChannel = guild.channels.cache.find(c => c.name === '🎯-plan-selection');
        if (planSelectionChannel) {
            await planSelectionChannel.send(createPlanSelectionEmbed());
            console.log(`   ✅ Plan selection system deployed`);
        }

        // Step 5: Create server rules
        console.log(`\n📋 Creating server rules...`);
        const rulesChannel = guild.channels.cache.find(c => c.name === '📋-server-rules');
        if (rulesChannel) {
            const rulesEmbed = new EmbedBuilder()
                .setTitle('📋 WordPress Pro Mastery - Server Rules')
                .setDescription(`
**💰 PAYMENT-FIRST PREMIUM COMMUNITY**

**⚠️ IMPORTANT: This is a PAID community. Free members have NO ACCESS to help channels.**

**🎯 Community Mission**
This is an exclusive community for WordPress professionals, business owners, and developers who want to master WordPress optimization and build profitable online businesses.

**💳 Payment Policy**
• All tiers except Free require monthly payment
• Payment must be completed within 24 hours of selection
• Screenshot proof required for all payments
• No refunds after access is granted
• Late payments result in immediate access removal

**📋 Server Rules**

**1. 🤝 Professional Conduct**
• Treat all members with respect and professionalism
• No harassment, hate speech, or discrimination
• Keep discussions constructive and helpful

**2. 💰 Payment Compliance**
• Complete payment within 24 hours of tier selection
• Provide clear payment screenshots
• Use correct payment reference (WPM-YourUserID)
• Contact admin immediately for payment issues

**3. 💬 Stay On Topic**
• WordPress optimization, development, and business discussions
• Ask questions in appropriate channels
• Use thread replies for detailed discussions

**4. 🚫 No Spam or Low-Quality Content**
• No excessive self-promotion without value
• No affiliate links without disclosure
• No repetitive or off-topic messages

**5. 💡 Share Value and Knowledge**
• Help others when you can
• Share working solutions and strategies
• Provide context when asking questions

**6. 🔒 Respect Privacy and Security**
• No sharing of login credentials or sensitive data
• Keep client information confidential
• Report security concerns to admins

**7. 📚 Use Correct Channels**
• Emergency issues: 🆘-urgent-emergencies
• General help: 🔧-general-help
• WooCommerce: 🛒-store-optimization
• Business: 📈-business-growth
• Payment issues: 📸-payment-proof

**8. 🎯 Quality Over Quantity**
• Focus on helpful, actionable content
• Think before posting - is this valuable?
• Use search before asking duplicate questions

**9. 💼 Business Ethics**
• Maintain professional standards
• No promotion of illegal or unethical practices
• Respect intellectual property

**10. 📱 Screenshot Requirements**
• Payment screenshots must be clear and readable
• Must show full transaction details
• Must include payment reference (WPM-YourUserID)
• Fake or edited screenshots result in permanent ban

**⚠️ Violations may result in warnings, temporary restrictions, or permanent removal. No refunds for rule violations.**

**🚀 Ready to invest in your WordPress success? Complete verification and payment to get started!**
                `)
                .setColor(0xFF0000)
                .setFooter({ text: 'Last updated: ' + new Date().toLocaleDateString() });

            await rulesChannel.send({ embeds: [rulesEmbed] });
            console.log(`   ✅ Server rules created`);
        }

        // Step 6: Set up payment information channel
        console.log(`\n💳 Setting up payment information...`);
        const paymentInfoChannel = guild.channels.cache.find(c => c.name === '💳-payment-info');
        if (paymentInfoChannel) {
            const paymentEmbed = new EmbedBuilder()
                .setTitle('💳 Payment Information & Instructions')
                .setDescription(`
**🔥 SPECIAL LAUNCH OFFER: 50% OFF FIRST MONTH!**

**💰 Pricing (First Month Special):**
• 🥉 WordPress Learner: ~~300 DH~~ **150 DH/month**
• 🥈 Speed Specialist: ~~600 DH~~ **300 DH/month**
• 🥇 Pro Optimizer: ~~1,200 DH~~ **600 DH/month**

**📱 PAYMENT METHODS:**

**1. 🏦 Bank Transfer (Fastest Approval)**
• Bank: Attijariwafa Bank
• Account: 007 640 0001234567890
• Account Name: WordPress Pro Mastery SARL
• SWIFT: BCMAMAMC (for international)

**2. 💳 PayPal (International)**
• Email: payments@wordpresspro.ma
• Currency: USD or EUR accepted
• Include your Discord username in notes

**3. 📱 Mobile Money (Morocco Only)**
• Orange Money: +212 6XX XXX XXX
• Inwi Money: +212 5XX XXX XXX
• Maroc Telecom: +212 6XX XXX XXX

**4. 💎 Cryptocurrency (Advanced)**
• Bitcoin (BTC): bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
• Ethereum (ETH): 0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C
• USDT (TRC20): TYour-USDT-Address-Here

**⚠️ CRITICAL PAYMENT STEPS:**
1. **Select your tier** in #🎯-plan-selection
2. **Make payment** using ONE method above
3. **Use reference:** WPM-YourDiscordUserID
4. **Take screenshot** of payment confirmation
5. **Upload screenshot** in #📸-payment-proof
6. **Wait for approval** (usually 1-2 hours)
7. **Get instant access** to your tier benefits!

**🕐 Payment Deadline:** 24 hours after tier selection
**❌ Late Payment Policy:** Account automatically removed
**🔄 Refund Policy:** No refunds after access granted
**📞 Payment Issues:** Contact @WordPress Master immediately

**🎯 What Happens After Payment:**
✅ Instant access to all tier channels
✅ Coaching session scheduling
✅ Priority support queue
✅ Monthly subscription auto-renewal
✅ Upgrade/downgrade options available
                `)
                .setColor(0x00FF00)
                .setFooter({ text: 'Secure payments processed within 2 hours' });

            await paymentInfoChannel.send({ embeds: [paymentEmbed] });
            console.log(`   ✅ Payment information created`);
        }

        // Success message
        console.log(`\n🎉 Advanced WordPress Pro Mastery server setup completed successfully!`);
        console.log(`\n📊 Server Features:`);
        console.log(`   • ${serverConfig.roles.length} sophisticated roles with verification system`);
        console.log(`   • ${serverConfig.categories.length} organized categories`);
        console.log(`   • ${serverConfig.categories.reduce((acc, cat) => acc + cat.channels.length, 0)} specialized channels including payment system`);
        console.log(`   • ${serverConfig.voiceChannels.length} voice channels with tier-based access`);
        console.log(`   • Interactive verification and plan selection system`);
        console.log(`   • Automated payment processing with screenshot verification`);
        console.log(`   • Advanced security and anti-spam measures`);
        console.log(`   • Automated member management tools`);
        console.log(`   • Real-time revenue tracking and subscription management`);
        
        console.log(`\n🔐 Security Features:`);
        console.log(`   • Verification requirement for all new members`);
        console.log(`   • Payment verification with screenshot proof`);
        console.log(`   • Rate limiting and spam protection`);
        console.log(`   • Automated role assignment based on tier selection`);
        console.log(`   • 24-hour payment deadline enforcement`);
        console.log(`   • Admin tools for member management`);
        
        console.log(`\n🚀 Next Steps:`);
        console.log(`   1. Assign yourself the "WordPress Master" role`);
        console.log(`   2. Update payment details in #💳-payment-info`);
        console.log(`   3. Create your first announcement`);
        console.log(`   4. Test the payment approval system`);
        console.log(`   5. Invite your first paying members!`);

    } catch (error) {
        console.error(`❌ Error during setup:`, error);
    }
}

// Event handlers
client.once('ready', () => {
    console.log(`\n🤖 Advanced WordPress Pro Mastery Bot is online!`);
    console.log(`📧 Logged in as: ${client.user.tag}`);
    console.log(`🌍 Connected to ${client.guilds.cache.size} server(s)`);
    console.log(`\n🔐 Security Features Active:`);
    console.log(`   • Rate limiting: ${securityConfig.rateLimitMessages} messages per minute`);
    console.log(`   • Verification required for all new members`);
    console.log(`   • Auto-kick unverified members after 10 minutes`);
    console.log(`   • Anti-spam protection enabled`);
    console.log(`\n💬 Available Commands:`);
    console.log(`   • !setup-server - Deploy complete server structure`);
    console.log(`   • !verify-member <@user> - Manually verify a member`);
    console.log(`   • !stats - Show server statistics`);
    console.log(`   • !help - Show all available commands`);
    console.log(`\n✨ Advanced WordPress Pro Mastery Community Ready!`);
});

// Handle new member joins
client.on('guildMemberAdd', async (member) => {
    console.log(`👋 New member joined: ${member.user.tag}`);
    
    // Assign unverified role
    const unverifiedRole = member.guild.roles.cache.find(r => r.name === 'Unverified');
    if (unverifiedRole) {
        await member.roles.add(unverifiedRole);
        console.log(`   🔒 Assigned Unverified role to ${member.user.tag}`);
    }

    // Set auto-kick timer
    setTimeout(async () => {
        if (member.roles.cache.has(unverifiedRole.id)) {
            try {
                await member.send(`
🚨 **Verification Required**

Hello ${member.user.username},

You were removed from WordPress Pro Mastery because you didn't complete verification within 10 minutes.

**To rejoin:**
1. Use the same invite link
2. Complete verification immediately
3. Select your membership tier

We maintain high standards to ensure a quality community for WordPress professionals.

Best regards,
WordPress Pro Mastery Team
                `);
                await member.kick('Failed to verify within time limit');
                console.log(`   ⚠️ Auto-kicked unverified member: ${member.user.tag}`);
            } catch (error) {
                console.error(`Failed to auto-kick member: ${error}`);
            }
        }
    }, securityConfig.autoKickUnverified);

    // Send welcome DM
    try {
        await member.send(`
🎉 **Welcome to WordPress Pro Mastery!**

Hello ${member.user.username},

Welcome to our exclusive WordPress optimization community! 

**🔐 Next Steps:**
1. **Read the rules** in #📋-server-rules
2. **Complete verification** in #✅-verification
3. **Select your tier** in #🎯-plan-selection
4. **Start optimizing** your WordPress success!

**⏰ Important:** You have 10 minutes to complete verification or you'll be automatically removed to maintain community quality.

**🎯 What You'll Get:**
• Expert WordPress optimization guidance
• Direct access to proven strategies
• Community of serious WordPress professionals
• Tier-based coaching and support

Ready to transform your WordPress expertise into results? Let's get started!

**WordPress Pro Mastery Team**
        `);
    } catch (error) {
        console.error(`Failed to send welcome DM: ${error}`);
    }
});

// Handle interactions (buttons, select menus, modals)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

    // Rate limiting check
    if (isRateLimited(interaction.user.id)) {
        await interaction.reply({ 
            content: '⚠️ Please slow down! You can only perform 5 actions per minute.', 
            ephemeral: true 
        });
        return;
    }

    addMessageToRateLimit(interaction.user.id);

    try {
        // Handle verification start
        if (interaction.isButton() && interaction.customId === 'start_verification') {
            if (isUserOnCooldown(interaction.user.id)) {
                await interaction.reply({ 
                    content: '⏰ Please wait 5 minutes before trying again.', 
                    ephemeral: true 
                });
                return;
            }

            const modal = createVerificationModal();
            await interaction.showModal(modal);
        }

        // Handle verification modal submission
        if (interaction.isModalSubmit() && interaction.customId === 'verification_modal') {
            const website = interaction.fields.getTextInputValue('website_url');
            const experience = interaction.fields.getTextInputValue('wp_experience');
            const goals = interaction.fields.getTextInputValue('optimization_goals');
            const challenges = interaction.fields.getTextInputValue('current_challenges');
            const business = interaction.fields.getTextInputValue('business_type');

            // Store verification data
            pendingVerifications.set(interaction.user.id, {
                website,
                experience,
                goals,
                challenges,
                business,
                timestamp: Date.now()
            });

            await interaction.reply({ 
                content: '✅ Verification submitted! Now please select your membership tier in the next channel.', 
                ephemeral: true 
            });

            // Log verification for admin
            const adminChannel = interaction.guild.channels.cache.find(c => c.name === '💼-member-management');
            if (adminChannel) {
                const verificationEmbed = new EmbedBuilder()
                    .setTitle('🔐 New Verification Submission')
                    .setDescription(`**User:** ${interaction.user.tag}\n**ID:** ${interaction.user.id}`)
                    .addFields(
                        { name: '🌐 Website', value: website || 'Not provided', inline: true },
                        { name: '🔧 Experience', value: experience.substring(0, 100) + '...', inline: true },
                        { name: '🎯 Goals', value: goals.substring(0, 100) + '...', inline: true },
                        { name: '⚠️ Challenges', value: challenges.substring(0, 100) + '...', inline: true },
                        { name: '💼 Business', value: business, inline: true }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp();

                await adminChannel.send({ embeds: [verificationEmbed] });
            }
        }

        // Handle tier selection
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_membership_tier') {
            const selectedTier = interaction.values[0];
            const member = interaction.member;

            // Check if user has completed verification
            const verificationData = pendingVerifications.get(interaction.user.id);
            if (!verificationData) {
                await interaction.reply({ 
                    content: '❌ Please complete verification first before selecting a tier.', 
                    ephemeral: true 
                });
                return;
            }

            let tierName;
            let tierPrice;
            let originalPrice;

            switch (selectedTier) {
                case 'free_member':
                    tierName = 'Free Member';
                    tierPrice = 'Free';
                    originalPrice = 'Free';
                    break;
                case 'wordpress_learner':
                    tierName = 'WordPress Learner';
                    tierPrice = '150 DH/month (50% OFF)';
                    originalPrice = '300 DH/month';
                    break;
                case 'speed_specialist':
                    tierName = 'Speed Specialist';
                    tierPrice = '300 DH/month (50% OFF)';
                    originalPrice = '600 DH/month';
                    break;
                case 'pro_optimizer':
                    tierName = 'Pro Optimizer';
                    tierPrice = '600 DH/month (50% OFF)';
                    originalPrice = '1,200 DH/month';
                    break;
            }

            // Store tier selection
            pendingPayments.set(interaction.user.id, {
                tier: selectedTier,
                tierName: tierName,
                price: tierPrice,
                originalPrice: originalPrice,
                timestamp: Date.now(),
                status: 'pending_payment'
            });

            if (selectedTier === 'free_member') {
                // Handle free member immediately
                const unverifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Unverified');
                const freeRole = interaction.guild.roles.cache.find(r => r.name === 'Free Member');
                
                if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
                    await member.roles.remove(unverifiedRole);
                }
                await member.roles.add(freeRole);

                await interaction.reply({ 
                    content: `🆓 **Welcome to Free Member!**\n\n❌ **Important:** Free members have NO ACCESS to help channels, coaching, or community support.\n\n**What you can see:**\n• This verification area only\n• Server rules\n\n**To get actual WordPress help, you must upgrade to a paid tier.**\n\n**Ready to upgrade? Select a paid tier above!**`, 
                    ephemeral: true 
                });

                // Remove from pending
                pendingPayments.delete(interaction.user.id);
                pendingVerifications.delete(interaction.user.id);
            } else {
                // Handle paid tiers - require payment first
                const paymentInstructions = createPaymentInstructionsEmbed(tierName, tierPrice, interaction.user.id);
                
                await interaction.reply({ 
                    content: `💰 **${tierName} Selected!**\n\n⚠️ **PAYMENT REQUIRED BEFORE ACCESS**\n\nYou have **24 hours** to complete payment or your account will be removed.\n\nFollow the instructions below:`, 
                    ephemeral: true 
                });

                // Send payment instructions to payment info channel
                const paymentChannel = interaction.guild.channels.cache.find(c => c.name === '💳-payment-info');
                if (paymentChannel) {
                    await paymentChannel.send(`**Payment Instructions for ${interaction.user.tag}:**`);
                    await paymentChannel.send(paymentInstructions);
                }

                // Set 24-hour payment deadline
                setTimeout(async () => {
                    const paymentData = pendingPayments.get(interaction.user.id);
                    if (paymentData && paymentData.status === 'pending_payment') {
                        try {
                            await member.send(`
🚨 **Payment Deadline Exceeded**

Hello ${member.user.username},

You were removed from WordPress Pro Mastery because you didn't complete payment within 24 hours.

**Selected Tier:** ${tierName}
**Required Payment:** ${tierPrice}

**To rejoin:**
1. Use the same invite link
2. Complete verification again
3. Select your tier and pay immediately

We maintain strict payment policies to ensure a premium community.

Best regards,
WordPress Pro Mastery Team
                            `);
                            await member.kick('Failed to complete payment within 24 hours');
                            pendingPayments.delete(interaction.user.id);
                            console.log(`   ⚠️ Auto-kicked member for non-payment: ${member.user.tag}`);
                        } catch (error) {
                            console.error(`Failed to auto-kick member for non-payment: ${error}`);
                        }
                    }
                }, 24 * 60 * 60 * 1000); // 24 hours
            }

            // Log tier selection for admin
            const adminChannel = interaction.guild.channels.cache.find(c => c.name === '💼-member-management');
            if (adminChannel) {
                const tierEmbed = new EmbedBuilder()
                    .setTitle('🎯 Tier Selection')
                    .setDescription(`**User:** ${interaction.user.tag}\n**Selected:** ${tierName}\n**Price:** ${tierPrice}\n**Status:** ${selectedTier === 'free_member' ? 'Completed' : 'Awaiting Payment'}`)
                    .setColor(selectedTier === 'free_member' ? 0x00FF00 : 0xFFAA00)
                    .setTimestamp();

                await adminChannel.send({ embeds: [tierEmbed] });
            }
        }

        // Handle payment screenshot upload
        if (interaction.isButton() && interaction.customId.startsWith('upload_payment_')) {
            await interaction.reply({ 
                content: `📸 **Upload Your Payment Screenshot**\n\n**Instructions:**\n1. Take a clear screenshot of your payment confirmation\n2. Make sure the screenshot shows:\n   • Payment amount\n   • Payment reference (WPM-${interaction.user.id})\n   • Transaction date/time\n   • Payment method used\n\n3. Upload the image in #📸-payment-proof channel\n4. Wait for admin approval (usually 1-2 hours)\n\n**⚠️ Important:** Blurry or incomplete screenshots will be rejected!`, 
                ephemeral: true 
            });
        }

        // Handle payment approval (Admin only)
        if (interaction.isButton() && interaction.customId.startsWith('approve_payment_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({ content: '❌ Admin only command.', ephemeral: true });
                return;
            }

            const userId = interaction.customId.split('_')[2];
            const member = interaction.guild.members.cache.get(userId);
            const paymentData = pendingPayments.get(userId);

            if (!member || !paymentData) {
                await interaction.reply({ content: '❌ Member or payment data not found.', ephemeral: true });
                return;
            }

            // Remove unverified role and assign tier role
            const unverifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Unverified');
            let tierRole;

            switch (paymentData.tier) {
                case 'wordpress_learner':
                    tierRole = interaction.guild.roles.cache.find(r => r.name === 'WordPress Learner');
                    break;
                case 'speed_specialist':
                    tierRole = interaction.guild.roles.cache.find(r => r.name === 'Speed Specialist');
                    break;
                case 'pro_optimizer':
                    tierRole = interaction.guild.roles.cache.find(r => r.name === 'Pro Optimizer');
                    break;
            }

            if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
                await member.roles.remove(unverifiedRole);
            }
            if (tierRole) {
                await member.roles.add(tierRole);
            }

            // Create subscription record
            const nextPayment = new Date();
            nextPayment.setMonth(nextPayment.getMonth() + 1);

            subscriptionData.set(userId, {
                tier: paymentData.tierName,
                price: paymentData.originalPrice,
                status: 'Active',
                startDate: Date.now(),
                nextPayment: nextPayment.getTime(),
                paymentHistory: [
                    {
                        date: Date.now(),
                        amount: paymentData.price,
                        status: 'Completed',
                        approvedBy: interaction.user.tag
                    }
                ]
            });

            // Update payment status
            paymentData.status = 'approved';
            paymentData.approvedBy = interaction.user.tag;
            paymentData.approvedAt = Date.now();

            await interaction.reply({ content: `✅ Payment approved for ${member.user.tag}! They now have full access to ${paymentData.tierName}.`, ephemeral: true });

            // Notify member
            try {
                await member.send(`
🎉 **Payment Approved - Welcome to ${paymentData.tierName}!**

Congratulations ${member.user.username}!

Your payment has been approved and you now have full access to:

**✅ Your Benefits:**
• All ${paymentData.tierName} channels and features
• Coaching sessions (check announcements)
• Priority support in help channels
• Access to exclusive resources
• Monthly subscription active

**📅 Next Payment:** ${new Date(nextPayment).toLocaleDateString()}
**💰 Monthly Amount:** ${paymentData.originalPrice}

**🚀 Get Started:**
1. Introduce yourself in #👋-introduce-yourself
2. Ask your first question in appropriate help channels
3. Join the next coaching session
4. Explore all your tier-specific channels

Welcome to the WordPress Pro Mastery community!

Best regards,
WordPress Pro Mastery Team
                `);
            } catch (error) {
                console.error('Failed to send approval DM:', error);
            }

            // Remove from pending
            pendingPayments.delete(userId);
            pendingVerifications.delete(userId);
        }

        // Handle payment rejection (Admin only)
        if (interaction.isButton() && interaction.customId.startsWith('reject_payment_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({ content: '❌ Admin only command.', ephemeral: true });
                return;
            }

            const userId = interaction.customId.split('_')[2];
            const member = interaction.guild.members.cache.get(userId);
            const paymentData = pendingPayments.get(userId);

            if (!member || !paymentData) {
                await interaction.reply({ content: '❌ Member or payment data not found.', ephemeral: true });
                return;
            }

            await interaction.reply({ content: `❌ Payment rejected for ${member.user.tag}. They have been notified.`, ephemeral: true });

            // Notify member
            try {
                await member.send(`
❌ **Payment Rejected**

Hello ${member.user.username},

Unfortunately, your payment screenshot for ${paymentData.tierName} has been rejected.

**Common reasons for rejection:**
• Screenshot is blurry or unreadable
• Payment amount doesn't match tier price
• Missing payment reference (WPM-${userId})
• Screenshot appears edited or fake
• Wrong payment method used

**Next Steps:**
1. Check your payment was actually processed
2. Take a new, clear screenshot
3. Upload it again in #📸-payment-proof
4. Contact admin if you need help

**⏰ Reminder:** You still have time before the 24-hour deadline.

Best regards,
WordPress Pro Mastery Team
                `);
            } catch (error) {
                console.error('Failed to send rejection DM:', error);
            }
        }

        // Handle request better screenshot (Admin only)
        if (interaction.isButton() && interaction.customId.startsWith('request_better_screenshot_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({ content: '❌ Admin only command.', ephemeral: true });
                return;
            }

            const userId = interaction.customId.split('_')[3];
            const member = interaction.guild.members.cache.get(userId);
            const paymentData = pendingPayments.get(userId);

            if (!member || !paymentData) {
                await interaction.reply({ content: '❌ Member or payment data not found.', ephemeral: true });
                return;
            }

            await interaction.reply({ content: `📸 Requested better screenshot from ${member.user.tag}.`, ephemeral: true });

            // Notify member
            try {
                await member.send(`
📸 **Better Screenshot Required**

Hello ${member.user.username},

Your payment screenshot for ${paymentData.tierName} needs to be clearer.

**Please provide a new screenshot that clearly shows:**
✅ Payment amount: ${paymentData.price}
✅ Payment reference: WPM-${userId}
✅ Transaction date and time
✅ Payment method used
✅ Transaction status (completed/successful)

**Tips for a good screenshot:**
• Use good lighting
• Make sure text is readable
• Include the full transaction details
• Don't crop important information

**Upload the new screenshot in #📸-payment-proof**

Best regards,
WordPress Pro Mastery Team
                `);
            } catch (error) {
                console.error('Failed to send better screenshot request DM:', error);
            }
        }

    } catch (error) {
        console.error('Error handling interaction:', error);
        if (!interaction.replied) {
            await interaction.reply({ 
                content: '❌ An error occurred. Please try again or contact an admin.', 
                ephemeral: true 
            });
        }
    }
});

// Handle messages for rate limiting and admin commands
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Handle payment screenshot uploads
    if (message.channel.name === '📸-payment-proof' && message.attachments.size > 0) {
        const paymentData = pendingPayments.get(message.author.id);
        if (!paymentData) {
            await message.reply('❌ No pending payment found. Please select a tier first.');
            return;
        }

        const attachment = message.attachments.first();
        if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
            await message.reply('❌ Please upload an image file (PNG, JPG, etc.)');
            return;
        }

        // Send to admin approval channel
        const approvalChannel = message.guild.channels.cache.find(c => c.name === '💰-payment-approvals');
        if (approvalChannel) {
            const approvalEmbed = createPaymentApprovalEmbed(
                message.author, 
                paymentData.tierName, 
                paymentData.price, 
                attachment.url
            );
            await approvalChannel.send(approvalEmbed);
        }

        await message.reply(`✅ **Payment screenshot received!**\n\n📋 **Details:**\n• Tier: ${paymentData.tierName}\n• Amount: ${paymentData.price}\n• Status: Pending admin approval\n\n⏰ **Approval Time:** Usually 1-2 hours\n📱 **You'll be notified** via DM when approved\n\n**What happens next:**\n1. Admin reviews your screenshot\n2. If approved: Instant access to all features\n3. If rejected: You'll get feedback and can resubmit`);

        console.log(`📸 Payment screenshot received from ${message.author.tag} for ${paymentData.tierName}`);
        return;
    }

    // Check rate limiting
    if (isRateLimited(message.author.id)) {
        await message.delete();
        const warning = await message.channel.send(`⚠️ ${message.author}, you're sending messages too quickly. Please slow down.`);
        setTimeout(() => warning.delete(), 5000);
        return;
    }

    addMessageToRateLimit(message.author.id);

    // Admin commands
    if (message.content.startsWith('!')) {
        // Setup server command
        if (message.content === '!setup-server') {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await message.reply('❌ You need Administrator permissions to run server setup.');
                return;
            }

            await message.reply('🚀 Setting up advanced WordPress Pro Mastery server with payment system... This will take 3-4 minutes!');
            console.log(`\n🎬 Advanced setup initiated by ${message.author.tag} in ${message.guild.name}`);
            
            await setupAdvancedWordPressServer(message.guild);
            
            await message.reply('✅ Advanced WordPress Pro Mastery server with automated payment system completed! Check console for details.');
        }

        // Server stats command
        if (message.content === '!stats') {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await message.reply('❌ You need Administrator permissions to view stats.');
                return;
            }

            const guild = message.guild;
            const members = guild.members.cache;

            const unverifiedCount = members.filter(m => m.roles.cache.some(r => r.name === 'Unverified')).size;
            const freeCount = members.filter(m => m.roles.cache.some(r => r.name === 'Free Member')).size;
            const learnerCount = members.filter(m => m.roles.cache.some(r => r.name === 'WordPress Learner')).size;
            const specialistCount = members.filter(m => m.roles.cache.some(r => r.name === 'Speed Specialist')).size;
            const proCount = members.filter(m => m.roles.cache.some(r => r.name === 'Pro Optimizer')).size;

            const pendingPaymentCount = pendingPayments.size;
            const activeSubscriptions = subscriptionData.size;

            // Calculate revenue (using original prices)
            const monthlyRevenue = (learnerCount * 300) + (specialistCount * 600) + (proCount * 1200);
            const yearlyRevenue = monthlyRevenue * 12;

            // Calculate first month revenue (50% off)
            const firstMonthRevenue = (learnerCount * 150) + (specialistCount * 300) + (proCount * 600);

            const statsEmbed = new EmbedBuilder()
                .setTitle('📊 WordPress Pro Mastery - Server Statistics')
                .setDescription(`
**👥 Total Members:** ${guild.memberCount}
**💰 Monthly Revenue:** ${monthlyRevenue} DH
**💎 Yearly Revenue:** ${yearlyRevenue} DH
**🔥 First Month Revenue:** ${firstMonthRevenue} DH (50% OFF promo)
                `)
                .addFields(
                    { name: '❓ Unverified', value: unverifiedCount.toString(), inline: true },
                    { name: '⏳ Pending Payment', value: pendingPaymentCount.toString(), inline: true },
                    { name: '🆓 Free Members', value: freeCount.toString(), inline: true },
                    { name: '🥉 WordPress Learners', value: learnerCount.toString(), inline: true },
                    { name: '🥈 Speed Specialists', value: specialistCount.toString(), inline: true },
                    { name: '🥇 Pro Optimizers', value: proCount.toString(), inline: true },
                    { name: '📊 Active Subscriptions', value: activeSubscriptions.toString(), inline: true },
                    { name: '💳 Payment Success Rate', value: `${activeSubscriptions > 0 ? Math.round((activeSubscriptions / (activeSubscriptions + pendingPaymentCount)) * 100) : 0}%`, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp()
                .setFooter({ text: 'Real-time statistics - Updates automatically' });

            await message.reply({ embeds: [statsEmbed] });
        }

        // Revenue dashboard command
        if (message.content === '!revenue') {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await message.reply('❌ You need Administrator permissions to view revenue dashboard.');
                return;
            }

            const guild = message.guild;
            const members = guild.members.cache;
            
            const learnerCount = members.filter(m => m.roles.cache.some(r => r.name === 'WordPress Learner')).size;
            const specialistCount = members.filter(m => m.roles.cache.some(r => r.name === 'Speed Specialist')).size;
            const proCount = members.filter(m => m.roles.cache.some(r => r.name === 'Pro Optimizer')).size;

            const monthlyRevenue = (learnerCount * 300) + (specialistCount * 600) + (proCount * 1200);
            const yearlyRevenue = monthlyRevenue * 12;
            const firstMonthRevenue = (learnerCount * 150) + (specialistCount * 300) + (proCount * 600);

            const revenueEmbed = new EmbedBuilder()
                .setTitle('💰 Revenue Dashboard')
                .setDescription(`
**📊 CURRENT MONTH BREAKDOWN:**

**🥉 WordPress Learners:** ${learnerCount} × 300 DH = ${learnerCount * 300} DH
**🥈 Speed Specialists:** ${specialistCount} × 600 DH = ${specialistCount * 600} DH  
**🥇 Pro Optimizers:** ${proCount} × 1,200 DH = ${proCount * 1200} DH

**💎 REVENUE PROJECTIONS:**
• **This Month (50% OFF):** ${firstMonthRevenue} DH
• **Monthly (Regular):** ${monthlyRevenue} DH
• **Yearly (Regular):** ${yearlyRevenue} DH

**🎯 GROWTH TARGETS:**
• **50 Members:** ${50 * 300} DH/month minimum
• **100 Members:** ${100 * 300} DH/month minimum  
• **200 Members:** ${200 * 300} DH/month minimum

**📈 CONVERSION RATES:**
• **Payment Success:** ${subscriptionData.size > 0 ? Math.round((subscriptionData.size / (subscriptionData.size + pendingPayments.size)) * 100) : 0}%
• **Upgrade Rate:** Calculate manually
• **Retention Rate:** Track monthly
                `)
                .setColor(0xFFD700)
                .setTimestamp()
                .setFooter({ text: 'Revenue tracking - WordPress Pro Mastery' });

            await message.reply({ embeds: [revenueEmbed] });
        }

        // Manual verification command
        if (message.content.startsWith('!verify-member')) {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await message.reply('❌ You need Administrator permissions to manually verify members.');
                return;
            }

            const mention = message.mentions.members.first();
            if (!mention) {
                await message.reply('❌ Please mention a user to verify. Usage: `!verify-member @username`');
                return;
            }

            const unverifiedRole = message.guild.roles.cache.find(r => r.name === 'Unverified');
            const freeRole = message.guild.roles.cache.find(r => r.name === 'Free Member');

            if (mention.roles.cache.has(unverifiedRole.id)) {
                await mention.roles.remove(unverifiedRole);
                await mention.roles.add(freeRole);
                await message.reply(`✅ Manually verified ${mention.user.tag} as Free Member.`);
            } else {
                await message.reply(`❌ ${mention.user.tag} is not in unverified status.`);
            }
        }

        // Subscription management command
        if (message.content.startsWith('!subscription')) {
            const mention = message.mentions.members.first();
            if (!mention) {
                // Show own subscription
                const subscriptionEmbed = createSubscriptionEmbed(message.author);
                if (subscriptionEmbed) {
                    await message.reply(subscriptionEmbed);
                } else {
                    await message.reply('❌ No active subscription found. Select a paid tier to create a subscription.');
                }
            } else {
                // Admin checking someone else's subscription
                if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    await message.reply('❌ You can only check your own subscription.');
                    return;
                }
                
                const subscriptionEmbed = createSubscriptionEmbed(mention.user);
                if (subscriptionEmbed) {
                    await message.reply(subscriptionEmbed);
                } else {
                    await message.reply(`❌ No active subscription found for ${mention.user.tag}.`);
                }
            }
        }

        // Help command
        if (message.content === '!help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🤖 WordPress Pro Mastery Bot Commands')
                .setDescription('Advanced Discord bot with automated payment system')
                .addFields(
                    { name: '!setup-server', value: 'Deploy complete server with payment system (Admin)', inline: false },
                    { name: '!stats', value: 'Show server statistics and revenue (Admin)', inline: false },
                    { name: '!revenue', value: 'Show detailed revenue dashboard (Admin)', inline: false },
                    { name: '!verify-member @user', value: 'Manually verify a member (Admin only)', inline: false },
                    { name: '!subscription [@user]', value: 'Show subscription details', inline: false },
                    { name: '!help', value: 'Show this help message', inline: false }
                )
                .setColor(0x0099FF)
                .setFooter({ text: 'WordPress Pro Mastery - Automated Payment & Community Management' });

            await message.reply({ embeds: [helpEmbed] });
        }
    }
});

// Error handling
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord
console.log('🔐 Connecting to Discord...');
client.login(process.env.DISCORD_BOT_TOKEN);