'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  FileText, 
  BarChart3,
  ChevronRight,
  Info,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ForecastSliderProps {
  currentScore: number
  topicGaps?: number
  currentTraffic?: number
  avgKeywordDifficulty?: number
  onGeneratePitch?: (targetScore: number, timeline: number) => void
}

interface Projection {
  month: number
  score: number
  traffic: number
  posts: number
}

export function ForecastSlider({
  currentScore,
  topicGaps = 20,
  currentTraffic = 1000,
  avgKeywordDifficulty = 50,
  onGeneratePitch
}: ForecastSliderProps) {
  const [targetScore, setTargetScore] = useState(Math.min(currentScore + 20, 95))
  const [timeline, setTimeline] = useState(6)

  // Calculate forecast based on inputs
  const forecast = useMemo(() => {
    const scoreDiff = targetScore - currentScore
    const difficultyFactor = 1 + (avgKeywordDifficulty / 100) * 0.5
    
    // Posts calculation
    const basePostsNeeded = Math.ceil(scoreDiff * 2 * difficultyFactor)
    const recommendedPosts = Math.max(basePostsNeeded, Math.min(topicGaps, scoreDiff * 1.5), 1)
    const postsPerMonth = Math.ceil(recommendedPosts / timeline)
    
    // Traffic projection
    const avgTrafficPerPost = 500 * (1 - avgKeywordDifficulty / 200)
    const projectedNewTraffic = recommendedPosts * avgTrafficPerPost * 0.03 * 30
    const trafficIncrease = currentTraffic > 0 
      ? Math.round((projectedNewTraffic / currentTraffic) * 100)
      : 100
    
    // New keywords
    const newKeywords = Math.round(recommendedPosts * 0.7)
    
    // Confidence
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    if (scoreDiff <= 15 && avgKeywordDifficulty <= 50) confidence = 'high'
    else if (scoreDiff >= 30 || avgKeywordDifficulty >= 70) confidence = 'low'
    
    // Monthly projections
    const projections: Projection[] = []
    for (let m = 1; m <= timeline; m++) {
      const progress = m / timeline
      const scoreProgress = Math.log(1 + progress * 2) / Math.log(3)
      const delayFactor = Math.min(1, (m - 1) / 2)
      const cumulativePosts = Math.min(postsPerMonth * m, recommendedPosts)
      
      projections.push({
        month: m,
        score: Math.round(currentScore + (scoreDiff * scoreProgress)),
        traffic: Math.round(currentTraffic + (projectedNewTraffic * progress * delayFactor)),
        posts: cumulativePosts
      })
    }
    
    return {
      recommendedPosts,
      postsPerMonth,
      trafficIncrease,
      newKeywords,
      confidence,
      projections,
      finalTraffic: Math.round(currentTraffic + projectedNewTraffic)
    }
  }, [targetScore, timeline, currentScore, topicGaps, currentTraffic, avgKeywordDifficulty])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
      case 'low': return <Badge className="bg-red-100 text-red-800">Lower Confidence</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Interactive Controls */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            SEO Score Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Target SEO Score</label>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
                  {currentScore}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <span className={`text-3xl font-bold ${getScoreColor(targetScore)}`}>
                  {targetScore}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={currentScore + 5}
              max={95}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-yellow-400 via-green-400 to-green-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  #fbbf24 0%, 
                  #fbbf24 ${((currentScore - 30) / 65) * 100}%, 
                  #4ade80 ${((currentScore - 30) / 65) * 100}%, 
                  #4ade80 ${((targetScore - 30) / 65) * 100}%, 
                  #e5e7eb ${((targetScore - 30) / 65) * 100}%, 
                  #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Current: {currentScore}</span>
              <span>Target: {targetScore} (+{targetScore - currentScore})</span>
            </div>
          </div>

          {/* Timeline Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Campaign Timeline</label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 9, 12].map((months) => (
                <button
                  key={months}
                  onClick={() => setTimeline(months)}
                  className={`py-3 rounded-lg border-2 transition-all ${
                    timeline === months
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-lg font-bold">{months}</div>
                  <div className="text-xs opacity-80">months</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
            <div className="text-3xl font-bold text-indigo-600">{forecast.recommendedPosts}</div>
            <p className="text-sm text-muted-foreground">Blog Posts</p>
            <p className="text-xs text-gray-400 mt-1">{forecast.postsPerMonth}/month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-3xl font-bold text-green-600">+{forecast.trafficIncrease}%</div>
            <p className="text-sm text-muted-foreground">Traffic Increase</p>
            <p className="text-xs text-gray-400 mt-1">→ {forecast.finalTraffic.toLocaleString()}/mo</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-3xl font-bold text-purple-600">{forecast.newKeywords}</div>
            <p className="text-sm text-muted-foreground">New Keywords</p>
            <p className="text-xs text-gray-400 mt-1">ranking on page 1</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
            <div className="text-3xl font-bold text-cyan-600">{timeline}</div>
            <p className="text-sm text-muted-foreground">Months</p>
            <p className="text-xs text-gray-400 mt-1">to reach target</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Projected Growth</CardTitle>
            {getConfidenceBadge(forecast.confidence)}
          </div>
        </CardHeader>
        <CardContent>
          {/* Simple bar chart */}
          <div className="space-y-3">
            {forecast.projections.map((proj) => (
              <div key={proj.month} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-500">Month {proj.month}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded transition-all"
                      style={{ width: `${(proj.score / 100) * 100}%` }}
                    />
                    <span className="text-sm font-medium">{proj.score}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{proj.posts} posts</span>
                    <span>{proj.traffic.toLocaleString()} traffic</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assumptions */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Forecast Assumptions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Publishing {forecast.postsPerMonth} quality blog posts per month</li>
                <li>• Each post targets a unique keyword from identified gaps</li>
                <li>• Content follows SEO best practices (1500+ words, proper structure)</li>
                <li>• Posts indexed within 1-2 weeks, ranking improvements in 2-3 months</li>
                <li>• No major algorithm updates or competitor changes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      {onGeneratePitch && (
        <div className="flex justify-center">
          <Button 
            size="lg"
            onClick={() => onGeneratePitch(targetScore, timeline)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8"
          >
            <Zap className="w-5 h-5 mr-2" />
            Generate Pitch Deck with This Forecast
          </Button>
        </div>
      )}
    </div>
  )
}
