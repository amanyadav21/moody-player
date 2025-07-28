const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Song title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    artist: {
        type: String,
        required: [true, 'Artist name is required'],
        trim: true,
        maxlength: [100, 'Artist name cannot exceed 100 characters']
    },
    audio: {
        type: String,
        required: [true, 'Audio URL is required']
    },
    mood: {
        type: String,
        required: [true, 'Mood is required'],
        enum: {
            values: ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral'],
            message: 'Mood must be one of: happy, sad, angry, surprised, disgusted, fearful, neutral'
        }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for better query performance
songSchema.index({ mood: 1 });
songSchema.index({ title: 1 });

const song = mongoose.model('Song', songSchema);

module.exports = song;