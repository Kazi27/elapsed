"use client"

import { useState, useEffect } from "react"
import { PlusCircle, LogOut, UserIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TimeSinceTracker } from "@/components/time-since-tracker"
import { AuthForm } from "@/components/auth-form"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface TrackerData {
  id: string
  name: string
  startDate: Date
}

type SortOrder = "newest" | "oldest" | "none"

export default function TimeSincePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [trackers, setTrackers] = useState<TrackerData[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>("none")
  const [isSwapping, setIsSwapping] = useState(false)
  const [displayOrder, setDisplayOrder] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        toast({
          title: "Welcome back!",
          description: "Your trackers are loading...",
        })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadTrackers(session.user.id)
        toast({
          title: "Signed in successfully",
          description: "Welcome to Time Since!",
        })
      } else {
        setTrackers([])
        setDisplayOrder([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadTrackers(user.id)
    }
  }, [user])

  useEffect(() => {
    setDisplayOrder(trackers.map((t) => t.id))
  }, [trackers])

  const loadTrackers = async (userId: string) => {
    const { data, error } = await supabase
      .from("trackers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "Error loading trackers",
        description: error.message,
        variant: "destructive",
      })
    } else {
      const formattedTrackers = data.map((tracker) => ({
        id: tracker.id,
        name: tracker.name,
        startDate: new Date(tracker.start_date),
      }))
      setTrackers(formattedTrackers)

      if (formattedTrackers.length > 0) {
        toast({
          title: "Trackers loaded",
          description: `Found ${formattedTrackers.length} tracker${formattedTrackers.length === 1 ? "" : "s"}`,
        })
      }
    }
  }

  const getSortedOrder = (currentTrackers: TrackerData[], order: SortOrder): string[] => {
    if (order === "none") return currentTrackers.map((t) => t.id)

    const sorted = [...currentTrackers].sort((a, b) => {
      if (order === "newest") {
        return b.startDate.getTime() - a.startDate.getTime()
      } else {
        return a.startDate.getTime() - b.startDate.getTime()
      }
    })

    return sorted.map((t) => t.id)
  }

  const animateSwaps = async (currentOrder: string[], targetOrder: string[]) => {
    const workingOrder = [...currentOrder]
    const swapDelay = 300 // ms between swaps

    // Create a bubble sort-like animation
    for (let i = 0; i < targetOrder.length; i++) {
      for (let j = 0; j < workingOrder.length - 1; j++) {
        const currentIndex = workingOrder.indexOf(targetOrder[i])

        if (currentIndex > i) {
          // Need to bubble up
          const swapIndex = currentIndex - 1

          // Animate the swap
          const card1 = document.querySelector(`[data-tracker-id="${workingOrder[currentIndex]}"]`) as HTMLElement
          const card2 = document.querySelector(`[data-tracker-id="${workingOrder[swapIndex]}"]`) as HTMLElement

          if (card1 && card2) {
            // Add swapping animation - vertical movement for grid layout
            card1.style.transform = "translateY(-100px)" // Move up
            card2.style.transform = "translateY(100px)" // Move down
            card1.style.transition = "transform 0.3s ease-in-out"
            card2.style.transition = "transform 0.3s ease-in-out"
            card1.style.zIndex = "10"
            card2.style.zIndex = "10"

            // Wait for animation
            await new Promise((resolve) => setTimeout(resolve, swapDelay))

            // Swap in working order
            const temp = workingOrder[currentIndex]
            workingOrder[currentIndex] = workingOrder[swapIndex]
            workingOrder[swapIndex] = temp

            // Update display order
            setDisplayOrder([...workingOrder])

            // Reset transforms
            card1.style.transform = ""
            card2.style.transform = ""
            card1.style.zIndex = ""
            card2.style.zIndex = ""

            // Small delay before next swap
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        } else if (currentIndex < i) {
          // Need to bubble down
          const swapIndex = currentIndex + 1

          if (swapIndex < workingOrder.length) {
            // Animate the swap
            const card1 = document.querySelector(`[data-tracker-id="${workingOrder[currentIndex]}"]`) as HTMLElement
            const card2 = document.querySelector(`[data-tracker-id="${workingOrder[swapIndex]}"]`) as HTMLElement

            if (card1 && card2) {
              // Add swapping animation - vertical movement for grid layout
              card1.style.transform = "translateY(100px)" // Move down
              card2.style.transform = "translateY(-100px)" // Move up
              card1.style.transition = "transform 0.3s ease-in-out"
              card2.style.transition = "transform 0.3s ease-in-out"
              card1.style.zIndex = "10"
              card2.style.zIndex = "10"

              // Wait for animation
              await new Promise((resolve) => setTimeout(resolve, swapDelay))

              // Swap in working order
              const temp = workingOrder[currentIndex]
              workingOrder[currentIndex] = workingOrder[swapIndex]
              workingOrder[swapIndex] = temp

              // Update display order
              setDisplayOrder([...workingOrder])

              // Reset transforms
              card1.style.transform = ""
              card2.style.transform = ""
              card1.style.zIndex = ""
              card2.style.zIndex = ""

              // Small delay before next swap
              await new Promise((resolve) => setTimeout(resolve, 100))
            }
          }
        }
      }
    }
  }

  const toggleSort = async () => {
    if (isSwapping) return

    setIsSwapping(true)

    // Calculate new sort order
    let newSortOrder: SortOrder
    if (sortOrder === "none") {
      newSortOrder = "newest"
    } else if (sortOrder === "newest") {
      newSortOrder = "oldest"
    } else {
      newSortOrder = "none"
    }

    const targetOrder = getSortedOrder(trackers, newSortOrder)

    toast({
      title: "Sorting trackers...",
      description: `Organizing by ${newSortOrder === "newest" ? "newest first" : newSortOrder === "oldest" ? "oldest first" : "creation order"}`,
    })

    // Animate the swaps
    await animateSwaps(displayOrder, targetOrder)

    setSortOrder(newSortOrder)
    setIsSwapping(false)

    toast({
      title: "Sorting complete!",
      description: `Trackers are now sorted by ${newSortOrder === "newest" ? "newest first" : newSortOrder === "oldest" ? "oldest first" : "creation order"}`,
    })
  }

  const getSortIcon = () => {
    if (sortOrder === "newest") return <ArrowDown className="h-4 w-4" />
    if (sortOrder === "oldest") return <ArrowUp className="h-4 w-4" />
    return <ArrowUpDown className="h-4 w-4" />
  }

  const getSortText = () => {
    if (sortOrder === "newest") return "Newest First"
    if (sortOrder === "oldest") return "Oldest First"
    return "Sort by Date"
  }

  const addNewTracker = async () => {
    if (!user) return

    const newTracker = {
      user_id: user.id,
      name: "New event",
      start_date: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("trackers").insert([newTracker]).select().single()

    if (error) {
      toast({
        title: "Failed to create tracker",
        description: error.message,
        variant: "destructive",
      })
    } else {
      const newTrackerData = {
        id: data.id,
        name: data.name,
        startDate: new Date(data.start_date),
      }

      setTrackers([newTrackerData, ...trackers])

      toast({
        title: "Tracker created!",
        description: "Your new time tracker is ready to use",
      })
    }
  }

  const updateTrackerName = async (id: string, name: string) => {
    const { error } = await supabase
      .from("trackers")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast({
        title: "Failed to update name",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setTrackers(trackers.map((tracker) => (tracker.id === id ? { ...tracker, name } : tracker)))

      toast({
        title: "Name updated",
        description: `Tracker renamed to "${name}"`,
      })
    }
  }

  const updateTrackerDate = async (id: string, startDate: Date) => {
    const { error } = await supabase
      .from("trackers")
      .update({ start_date: startDate.toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast({
        title: "Failed to update date",
        description: error.message,
        variant: "destructive",
      })
    } else {
      const updatedTrackers = trackers.map((tracker) => (tracker.id === id ? { ...tracker, startDate } : tracker))
      setTrackers(updatedTrackers)

      // If we're in a sorted view, animate the card to its new position
      if (sortOrder !== "none" && !isSwapping) {
        const newTargetOrder = getSortedOrder(updatedTrackers, sortOrder)
        if (JSON.stringify(newTargetOrder) !== JSON.stringify(displayOrder)) {
          setIsSwapping(true)
          await animateSwaps(displayOrder, newTargetOrder)
          setIsSwapping(false)
        }
      }

      toast({
        title: "Date updated",
        description: "Tracker time has been updated",
      })
    }
  }

  const removeTracker = async (id: string) => {
    const trackerName = trackers.find((t) => t.id === id)?.name || "tracker"

    const { error } = await supabase.from("trackers").delete().eq("id", id)

    if (error) {
      toast({
        title: "Failed to delete tracker",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setTrackers(trackers.filter((tracker) => tracker.id !== id))
      setDisplayOrder(displayOrder.filter((trackerId) => trackerId !== id))

      toast({
        title: "Tracker deleted",
        description: `"${trackerName}" has been removed`,
      })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Signed out",
      description: "See you next time!",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 dark:border-slate-200 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster />
      </>
    )
  }

  // Get trackers in display order
  const orderedTrackers = displayOrder.map((id) => trackers.find((t) => t.id === id)).filter(Boolean) as TrackerData[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-20">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center relative">
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <UserIcon className="h-4 w-4" />
              {user.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hover:shadow-lg hover:shadow-red-500/25 hover:border-red-500/50 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-slate-800 dark:text-slate-100 drop-shadow-sm">Time Since</h1>
          <p className="text-slate-600 dark:text-slate-400">Track how much time has passed since important events</p>

          {trackers.length > 1 && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSort}
                disabled={isSwapping}
                className="hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-300 disabled:opacity-50"
              >
                {getSortIcon()}
                <span className="ml-2">{isSwapping ? "Swapping..." : getSortText()}</span>
              </Button>
            </div>
          )}
        </header>

        <div className="grid gap-6 max-w-4xl mx-auto">
          {orderedTrackers.map((tracker) => (
            <div key={tracker.id} data-tracker-id={tracker.id} className="relative">
              <TimeSinceTracker
                id={tracker.id}
                name={tracker.name}
                startDate={tracker.startDate}
                onNameChange={updateTrackerName}
                onDateChange={updateTrackerDate}
                onRemove={removeTracker}
              />
            </div>
          ))}

          {trackers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400 mb-4">No trackers yet. Create your first one!</p>
            </div>
          )}

          <Button
            onClick={addNewTracker}
            variant="outline"
            className="flex items-center gap-2 mx-auto mt-4 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 hover:border-blue-500/50 text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <PlusCircle className="h-4 w-4" />
            Add new tracker
          </Button>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
