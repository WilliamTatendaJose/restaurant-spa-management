"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Info } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useSyncStatus } from "@/components/sync-status-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function DatabaseSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; errors?: string[]; createdTables?: string[]; updatedTables?: string[] } | null>(null)
  const { toast } = useToast()
  const { resetSchemaErrors } = useSyncStatus()
  const isConfigured = isSupabaseConfigured()

  const runMigration = async (createTables: boolean = false) => {
    setIsLoading(true)
    setResult(null)

    try {
      // POST request is required for the actual migration
      const response = await fetch(`/api/migrate${createTables ? "?createTables=true" : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        // Reset schema errors in the sync status provider
        resetSchemaErrors()
        
        toast({
          title: "Migration successful",
          description: data.message || "Database schema updated successfully",
        })
      } else {
        toast({
          title: "Migration failed",
          description: data.error || "Failed to update database schema",
          variant: "destructive",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
      
      toast({
        title: "Migration failed",
        description: "An unexpected error occurred during migration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Database Management</h1>
      
      <Tabs defaultValue="migration" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="migration">Schema Migration</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="migration">
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
                      
                    {result.createdTables && result.createdTables.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Created tables:</p>
                        <ul className="list-disc ml-5 mt-1">
                          {result.createdTables.map(table => (
                            <li key={table} className="text-xs">{table}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.updatedTables && result.updatedTables.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Updated tables:</p>
                        <ul className="list-disc ml-5 mt-1">
                          {result.updatedTables.map(table => (
                            <li key={table} className="text-xs">{table}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold text-red-500">Errors:</p>
                        <ul className="list-disc ml-5 mt-1">
                          {result.errors.map((error, i) => (
                            <li key={i} className="text-xs text-red-400">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground mb-4">
                This will create any missing columns and add required fields for synchronization.
                It's safe to run this multiple times as it only adds missing tables and columns.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={() => runMigration(false)} disabled={isLoading || !isConfigured}>
                {isLoading ? "Running Migration..." : "Update Schema"}
              </Button>

              <Button
                variant="outline"
                onClick={() => runMigration(true)}
                disabled={isLoading || !isConfigured}
              >
                Create All Tables
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="troubleshooting">
          <Card>
            <CardHeader>
              <CardTitle>Database Troubleshooting</CardTitle>
              <CardDescription>
                Common issues and their solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Schema Mismatch Issues</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>If you're seeing errors like these, you need to run the database migration:</p>
                  <ul className="list-disc ml-5">
                    <li className="text-sm text-muted-foreground">
                      "Could not find the 'is_available' column of 'inventory'"
                    </li>
                    <li className="text-sm text-muted-foreground">
                      "null value in column 'id' violates not-null constraint"
                    </li>
                    <li className="text-sm text-muted-foreground">
                      "Could not find the 'customer_id' column of 'bookings'"
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Common Solutions</h3>
                <ul className="list-disc ml-5 space-y-2">
                  <li className="text-sm">
                    <span className="font-semibold">Schema errors:</span> Click the "Update Schema" button above to fix column mismatches.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Missing tables:</span> Click "Create All Tables" if you're setting up a new database.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Sync failing:</span> Try toggling auto-sync off and on from the status bar.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Permissions issues:</span> Ensure your Supabase project has the correct security permissions.
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => window.open("https://supabase.com/docs", "_blank")}
              >
                Supabase Documentation
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
