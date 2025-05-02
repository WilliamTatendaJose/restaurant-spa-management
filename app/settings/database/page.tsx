"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function DatabaseSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const isConfigured = isSupabaseConfigured()

  const runMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/migrate")
      const data = await response.json()

      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Database Migration</CardTitle>
          <CardDescription>
            Run database migration to ensure all required tables and columns exist in your Supabase database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfigured && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Configured</AlertTitle>
              <AlertDescription>
                Supabase is not properly configured. Please check your environment variables.
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message ||
                  result.error ||
                  (result.success ? "Migration completed successfully" : "Migration failed")}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground mb-4">
            This will create any missing tables and add the required columns for synchronization. It's safe to run this
            multiple times as it only adds missing tables and columns.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={runMigration} disabled={isLoading || !isConfigured}>
            {isLoading ? "Running Migration..." : "Run Migration"}
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              setIsLoading(true)
              setResult(null)

              try {
                // Create all tables
                const response = await fetch("/api/migrate?createTables=true")
                const data = await response.json()

                setResult(data)
              } catch (error) {
                setResult({
                  success: false,
                  error: error instanceof Error ? error.message : "Unknown error occurred",
                })
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading || !isConfigured}
          >
            Create All Tables
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
