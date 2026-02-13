const Post = require('../models/Post');


exports.createPost = async (req, res, next) => {
    try {
        req.body.user = req.user.id;

        const post = await Post.create(req.body);

        res.status(201).json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
};

exports.getPostsByPlace = async (req, res, next) => {
    try {
        const posts = await Post.find({ placeId: req.params.placeId })
            .populate({
                path: 'user',
                select: 'name profileImage'
            })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: posts.length,
            data: posts
        });
    } catch (error) {
        next(error);
    }
};
