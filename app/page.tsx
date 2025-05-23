"use client"

import { useState } from "react"
import BottomSheet from "@/components/bottom-sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, User, Bell, HelpCircle, LogOut } from "lucide-react"

export default function Home() {
  const [isOpen, setIsOpen] = useState(false)
  const [snapPoint, setSnapPoint] = useState<"closed" | "half" | "full">("closed")

  const menuItems = [
    { icon: User, label: "Profile", description: "Manage your account settings" },
    { icon: Bell, label: "Notifications", description: "Configure notification preferences" },
    { icon: Settings, label: "Settings", description: "App settings and preferences" },
    { icon: HelpCircle, label: "Help & Support", description: "Get help and contact support" },
    { icon: LogOut, label: "Sign Out", description: "Sign out of your account" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bottom Sheet Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test the bottom sheet component with gesture interactions and snap points.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setSnapPoint("half")} variant="outline" size="sm">
                Half Open
              </Button>
              <Button onClick={() => setSnapPoint("full")} size="sm">
                Full Open
              </Button>
            </div>

            <Button onClick={() => setSnapPoint("closed")} variant="secondary" className="w-full">
              Close Sheet
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Instructions:</h2>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• Drag the handle to move between snap points</li>
            <li>• Use buttons above for programmatic control</li>
            <li>• Try on mobile for touch gestures</li>
            <li>• Press ESC to close when open</li>
          </ul>
        </div>
      </div>

      <BottomSheet snapPoint={snapPoint} onSnapPointChange={setSnapPoint} onClose={() => setSnapPoint("closed")}>
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Menu</h2>
            <p className="text-sm text-muted-foreground">Choose an option from the menu below</p>
          </div>

          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Drag the handle above or use gestures to navigate
            </p>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
