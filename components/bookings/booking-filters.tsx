import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BookingFilters() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="booking-type">Booking Type</Label>
          <RadioGroup defaultValue="all" id="booking-type">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spa" id="spa" />
              <Label htmlFor="spa">Spa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="restaurant" id="restaurant" />
              <Label htmlFor="restaurant">Restaurant</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select defaultValue="all">
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="staff">Staff Member</Label>
          <Select defaultValue="all">
            <SelectTrigger id="staff">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="john">John Smith</SelectItem>
              <SelectItem value="maria">Maria Garcia</SelectItem>
              <SelectItem value="david">David Kim</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
