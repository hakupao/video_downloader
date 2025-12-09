import { useState, useEffect } from 'react'
import axios from 'axios'
import { Download, Link2, Lock, Play, Loader2, CheckCircle, AlertCircle, Video, Music } from 'lucide-react'
import clsx from 'clsx'

interface VideoInfo {
    title: string
    thumbnail: string
    duration: number
    webpage_url: string
    formats: { format_id: string, label: string, ext: string }[]
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [accessCode, setAccessCode] = useState('')
    const [isLoadingAuth, setIsLoadingAuth] = useState(false)

    // Dashboard State
    const [url, setUrl] = useState('')
    const [loadingInfo, setLoadingInfo] = useState(false)
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
    const [selectedFormat, setSelectedFormat] = useState<string>('best')
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadSuccess, setDownloadSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load auth state
    useEffect(() => {
        const savedAuth = localStorage.getItem('auth_code')
        if (savedAuth) {
            verifyAuthCode(savedAuth)
        }
    }, [])

    const verifyAuthCode = async (code: string) => {
        setIsLoadingAuth(true)
        setError(null)
        try {
            await axios.post('/api/auth', { code })
            setIsAuthenticated(true)
            localStorage.setItem('auth_code', code)
        } catch (err) {
            setError('Invalid Access Code')
            localStorage.removeItem('auth_code')
        } finally {
            setIsLoadingAuth(false)
        }
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        verifyAuthCode(accessCode)
    }

    const handleGetInfo = async () => {
        if (!url) return
        setLoadingInfo(true)
        setError(null)
        setVideoInfo(null)
        try {
            const storedCode = localStorage.getItem('auth_code')
            const res = await axios.post('/api/info', { url }, {
                headers: { 'x-access-code': storedCode }
            })
            setVideoInfo(res.data)
            setIsDownloading(false)
            setDownloadSuccess(false)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch video info')
        } finally {
            setLoadingInfo(false)
        }
    }

    const handleDownload = async () => {
        if (!videoInfo) return
        setIsDownloading(true)
        setError(null)
        try {
            const storedCode = localStorage.getItem('auth_code')
            const response = await axios.post('/api/download', {
                url,
                format_id: selectedFormat
            }, {
                headers: { 'x-access-code': storedCode },
                responseType: 'blob'
            })

            // Create download link
            const blob = new Blob([response.data], { type: response.headers['content-type'] })
            const link = document.createElement('a')
            link.href = window.URL.createObjectURL(blob)

            // Try to get filename from header or default
            const contentDisposition = response.headers['content-disposition']
            let filename = `download.${selectedFormat === 'bestaudio' ? 'mp3' : 'mp4'}`
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/)
                if (match) filename = match[1]
            }

            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setDownloadSuccess(true)
        } catch (err: any) {
            setError('Download failed. Please try again.')
        } finally {
            setIsDownloading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-panel max-w-md w-full p-8 rounded-2xl animate-slide-up">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-primary-600/20 rounded-full">
                            <Lock className="w-8 h-8 text-primary-500" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Private Access</h1>
                    <p className="text-slate-400 text-center mb-8">Enter your access code to continue</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Access Code"
                            className="input-field text-center tracking-widest text-lg"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                        />
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoadingAuth || !accessCode}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoadingAuth ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock"}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Download className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">InstaLoad</h1>
                            <p className="text-xs text-slate-400">Universal Video Downloader</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('auth_code')
                            setIsAuthenticated(false)
                        }}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Sign Out
                    </button>
                </header>

                {/* Input Section */}
                <div className="glass-panel p-2 rounded-2xl flex gap-2">
                    <div className="flex-1 relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Link2 className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Paste YouTube, Douyin, or TikTok link..."
                            className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:ring-0"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGetInfo()}
                        />
                    </div>
                    <button
                        onClick={handleGetInfo}
                        disabled={loadingInfo || !url}
                        className="btn-primary py-2 px-6 rounded-xl text-sm"
                    >
                        {loadingInfo ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-slide-up">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Video Card */}
                {videoInfo && (
                    <div className="glass-panel rounded-3xl overflow-hidden animate-slide-up">
                        <div className="md:flex">
                            <div className="md:w-1/2 relative group">
                                <img
                                    src={videoInfo.thumbnail}
                                    alt={videoInfo.title}
                                    className="w-full h-48 md:h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-12 h-12 text-white fill-current" />
                                </div>
                            </div>

                            <div className="p-6 md:w-1/2 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-lg font-bold line-clamp-2 mb-2">{videoInfo.title}</h2>
                                    <p className="text-slate-400 text-sm mb-4 truncate">{videoInfo.webpage_url}</p>

                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Format</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {videoInfo.formats.map((fmt) => (
                                                <button
                                                    key={fmt.format_id}
                                                    onClick={() => setSelectedFormat(fmt.format_id)}
                                                    className={clsx(
                                                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                        selectedFormat === fmt.format_id
                                                            ? "bg-primary-500/20 border-primary-500 text-white"
                                                            : "bg-dark-900/50 border-white/5 text-slate-400 hover:bg-dark-900"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                                        selectedFormat === fmt.format_id ? "bg-primary-500" : "bg-dark-800"
                                                    )}>
                                                        {fmt.label.includes("Audio") ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                                    </div>
                                                    <span className="text-sm font-medium">{fmt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className={clsx(
                                            "w-full btn-primary flex items-center justify-center gap-2",
                                            downloadSuccess && "bg-green-500 hover:bg-green-600 shadow-green-500/20"
                                        )}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Downloading...</span>
                                            </>
                                        ) : downloadSuccess ? (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                <span>Downloaded!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                <span>Download Now</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default App
