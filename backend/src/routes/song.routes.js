const express = require('express')
const multer = require('multer')
const router = express.Router()
const uploadFile = require('../service/storage.service.js')
const songModel = require('../models/song.model.js')




const upload = multer({ storage: multer.memoryStorage() })


/* 

title
artist
audio
This file handles the routes for song-related operations.

*/



router.post('/songs',upload.single('audio'), async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.file);
        
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                message: 'No audio file uploaded',
                error: 'Audio file is required'
            });
        }

        // Validate required fields
        const { title, artist, mood } = req.body;
        if (!title || !artist || !mood) {
            return res.status(400).json({
                message: 'Missing required fields',
                error: 'Title, artist, and mood are required'
            });
        }

        // Validate mood
        const validMoods = ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral'];
        if (!validMoods.includes(mood.toLowerCase())) {
            return res.status(400).json({
                message: 'Invalid mood',
                error: `Mood must be one of: ${validMoods.join(', ')}`
            });
        }

        const fileData = await uploadFile(req.file);
        console.log(fileData);

        const song = await songModel.create({
            title: title.trim(),
            artist: artist.trim(),
            audio: fileData.url,
            mood: mood.toLowerCase()
        })

        res.status(201).json({
            message: 'Song added successfully',
            song: song,
            fileData: fileData
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        
        // Handle validation errors specifically
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                error: error.message
            });
        }
        
        res.status(500).json({
            message: 'Error uploading song',
            error: error.message
        });
    }
});

router.get('/songs', async (req, res) => {
    try {
        const { mood } = req.query;
        
        let query = {};
        if (mood) {
            query.mood = mood;
        }
        
        const songs = await songModel.find(query);
        
        res.status(200).json({
            message: "Songs fetched successfully",
            count: songs.length,
            songs: songs
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({
            message: 'Error fetching songs',
            error: error.message
        });
    }
});

// Get all songs (for testing)
router.get('/all-songs', async (req, res) => {
    try {
        const songs = await songModel.find({});
        res.status(200).json({
            message: "All songs fetched successfully",
            count: songs.length,
            songs: songs
        });
    } catch (error) {
        console.error('Error fetching all songs:', error);
        res.status(500).json({
            message: 'Error fetching all songs',
            error: error.message
        });
    }
});

module.exports = router;