import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Pause, Music, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

const MusicPlayer = ({ detectedMood }) => {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
    const [audioElements, setAudioElements] = useState({})
    const [lastFetchedMood, setLastFetchedMood] = useState(null)

    // Fetch songs based on detected mood
    const fetchSongsByMood = async (mood) => {
        if (!mood) return;
        
        setLoading(true)
        setError('')
        
        try {
            const response = await axios.get(`http://localhost:3000/api/songs?mood=${mood.toLowerCase()}`, {
                timeout: 10000 // 10 second timeout
            })
            
            if (response.data.songs && response.data.songs.length > 0) {
                setSongs(response.data.songs)
            } else {
                // If no songs found for specific mood, get all songs
                try {
                    const allSongsResponse = await axios.get('http://localhost:3000/api/all-songs', {
                        timeout: 10000
                    })
                    setSongs(allSongsResponse.data.songs || [])
                } catch (fallbackError) {
                    console.error('Fallback fetch error:', fallbackError)
                    setSongs([])
                }
            }
        } catch (err) {
            console.error('Error fetching songs:', err)
            if (err.code === 'ECONNABORTED') {
                setError('Request timeout. Please check your connection and try again.')
            } else if (err.response?.status === 404) {
                setError('Songs not found. The backend server might not be running.')
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again later.')
            } else if (err.request) {
                setError('Cannot connect to server. Please check if the backend is running.')
            } else {
                setError('Failed to fetch songs. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    // Effect to fetch songs when mood changes
    useEffect(() => {
        if (detectedMood && detectedMood !== lastFetchedMood) {
            fetchSongsByMood(detectedMood)
            setLastFetchedMood(detectedMood)
        }
    }, [detectedMood, lastFetchedMood])

    // Play/Pause functionality
    const togglePlayPause = (index, song) => {
        // Pause all other songs first
        Object.values(audioElements).forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause()
            }
        })

        if (currentlyPlaying === index) {
            // Pause current song
            const audio = audioElements[index]
            if (audio) {
                audio.pause()
            }
            setCurrentlyPlaying(null)
        } else {
            // Play new song
            let audio = audioElements[index]
            if (!audio && song.audio) {
                audio = new Audio(song.audio)
                audio.addEventListener('ended', () => {
                    setCurrentlyPlaying(null)
                })
                audio.addEventListener('error', (e) => {
                    console.error('Audio error:', e)
                    setError('Error playing audio file')
                })
                setAudioElements(prev => ({ ...prev, [index]: audio }))
            }
            
            if (audio) {
                audio.play().catch(err => {
                    console.error('Play error:', err)
                    setError('Cannot play this audio file')
                })
                setCurrentlyPlaying(index)
            }
        }
    }

    // Cleanup audio elements on unmount
    useEffect(() => {
        return () => {
            Object.values(audioElements).forEach(audio => {
                if (audio) {
                    audio.pause()
                    audio.src = ''
                }
            })
        }
    }, [audioElements])

    return (
        <div className="space-y-4">
            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-gray-600">Finding perfect songs for your mood...</span>
                </div>
            )}
            
            {/* Error State */}
            {error && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-700 text-sm">{error}</span>
                    </div>
                    <Button
                        onClick={() => detectedMood && fetchSongsByMood(detectedMood)}
                        variant="outline"
                        size="sm"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                    </Button>
                </div>
            )}
            
            {/* Info State - No mood detected */}
            {!detectedMood && !loading && (
                <div className="text-center py-8">
                    <Music className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No emotion detected yet</p>
                    <p className="text-sm text-gray-500">
                        Use the camera to detect your mood and get personalized recommendations
                    </p>
                </div>
            )}
            
            {/* Songs List */}
            {songs.length > 0 ? (
                <div className="space-y-3">
                    {songs.map((song, index) => (
                        <Card key={song._id || index} className="transition-all hover:shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {song.title || 'Unknown Title'}
                                        </h3>
                                        <p className="text-sm text-gray-600 truncate">
                                            {song.artist || 'Unknown Artist'}
                                        </p>
                                        {song.mood && (
                                            <div className="mt-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {song.mood}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Button
                                        onClick={() => togglePlayPause(index, song)}
                                        variant="outline"
                                        size="icon"
                                        className="ml-4 flex-shrink-0"
                                    >
                                        {currentlyPlaying === index ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    {/* Songs Count */}
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                            Found {songs.length} song{songs.length !== 1 ? 's' : ''} for your mood
                        </p>
                    </div>
                </div>
            ) : (
                /* No songs found */
                !loading && detectedMood && !error && (
                    <div className="text-center py-8">
                        <Music className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">
                            No songs found for <strong>{detectedMood}</strong> mood
                        </p>
                        <p className="text-sm text-gray-500">
                            Try uploading some songs or detecting a different emotion
                        </p>
                    </div>
                )
            )}
        </div>
    )
}

export default MusicPlayer