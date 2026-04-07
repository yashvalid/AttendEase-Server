const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');

let redisConnected = false;

// Initialize rate limiter with Redis
const initRateLimiter = async () => {
    redisConnected = true;
    return Promise.resolve();
};

// Generic rate limiter factory - creates limiters on first use (lazy loading)
const createLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000,
        max = 100,
        message = 'Too many requests from this IP, please try again later.',
        statusCode = 429,
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        keyGenerator = (req) => req.ip,
    } = options;

    let limiter = null;

    // Return middleware that defers limiter creation
    return (req, res, next) => {
        // Create limiter on first request (after Redis is connected)
        if (!limiter) {
            limiter = rateLimit({
                store: new RedisStore({
                    sendCommand: async (...commandArgs) => {
                        return await redisClient.sendCommand(commandArgs);
                    },
                    prefix: 'rl:',
                }),
                windowMs,
                max,
                message,
                statusCode,
                skipSuccessfulRequests,
                skipFailedRequests,
                keyGenerator,
                handler: (req, res) => {
                    res.status(statusCode).json({
                        error: message,
                        retryAfter: req.rateLimit?.resetTime || new Date(),
                    });
                },
            });
        }

        // Use the created limiter
        return limiter(req, res, next);
    };
};

// ==================== RATE LIMITERS ====================

// Strict limiter - expensive read operations (reports, statistics)
// 10 requests per 15 minutes
const strictLimiter = () =>
    createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: 'Too many expensive requests. Please try again later.',
        keyGenerator: (req) => req.user?.user_id || req.ip,
    });

// Moderate limiter - regular reads (user lists, class lists)
// 30 requests per 15 minutes
const moderateLimiter = () =>
    createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: 'Too many requests. Please slow down.',
        keyGenerator: (req) => req.user?.user_id || req.ip,
    });

// Attendance marking limiter - prevents spam marking
// 5 requests per minute per user
const attendanceMarkLimiter = () =>
    createLimiter({
        windowMs: 60 * 1000,
        max: 5,
        message: 'Attendance marked too frequently. Please wait before marking again.',
        keyGenerator: (req) => req.user?.user_id || req.ip,
    });

// Authentication limiter - prevents brute force attacks
// 5 attempts per 15 minutes
const authLimiter = () =>
    createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many login/register attempts. Please try again later.',
        keyGenerator: (req) => req.ip,
        skipSuccessfulRequests: true,
    });

// Write operations limiter - prevents spam on updates/deletes
// 20 requests per 15 minutes
const writeLimiter = () =>
    createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: 'Too many write operations. Please wait before trying again.',
        keyGenerator: (req) => req.user?.user_id || req.ip,
    });

// Event creation limiter - prevents spam attendance events
// 10 events per hour
const eventCreationLimiter = () =>
    createLimiter({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: 'Too many attendance events created. Please try again later.',
        keyGenerator: (req) => req.user?.user_id || req.ip,
    });

module.exports = {
    initRateLimiter,
    strictLimiter,
    moderateLimiter,
    attendanceMarkLimiter,
    authLimiter,
    writeLimiter,
    eventCreationLimiter,
};
