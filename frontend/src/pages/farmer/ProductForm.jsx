import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import LocationPicker from '@/components/LocationPicker'
import { productApi, uploadImage } from '@/lib/api'
import { NIGERIAN_STATES, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/lib/constants'
import { resolveImage } from '@/lib/utils'

const EMPTY = {
  name: '',
  category: '',
  description: '',
  quantity: '',
  unit: 'kg',
  price: '',
  state: '',
  city: '',
  image_url: null,
  latitude: null,
  longitude: null,
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!editing) return
    productApi
      .get(id)
      .then((product) => {
        setForm({
          name: product.name,
          category: product.category,
          description: product.description || '',
          quantity: product.quantity,
          unit: product.unit,
          price: product.price,
          state: product.state || '',
          city: product.city || '',
          image_url: product.image_url,
          latitude: product.latitude,
          longitude: product.longitude,
        })
      })
      .catch((error) => {
        toast.error(error.message)
        navigate('/farmer/products')
      })
      .finally(() => setLoading(false))
  }, [editing, id, navigate])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      update('image_url', url)
      toast.success('Image uploaded.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (!form.name || !form.category || !form.quantity || !form.price) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        quantity: Number(form.quantity),
        unit: form.unit,
        price: Number(form.price),
        state: form.state || null,
        city: form.city || null,
        image_url: form.image_url,
        latitude: form.latitude,
        longitude: form.longitude,
      }
      if (editing) {
        await productApi.update(id, payload)
        toast.success('Listing updated.')
      } else {
        await productApi.create(payload)
        toast.success('Product listed.')
      }
      navigate('/farmer/products')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  const preview = resolveImage(form.image_url)

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit listing' : 'Add a new product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Product name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="e.g. White Maize"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(value) => update('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select value={form.unit} onValueChange={(value) => update('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity available *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity}
                  onChange={(event) => update('quantity', event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price per {form.unit} (₦) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="any"
                  value={form.price}
                  onChange={(event) => update('price', event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(value) => update('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City / LGA</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                  placeholder="e.g. Jos North"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Describe the quality, harvest date, handling, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Product image</Label>
              {preview ? (
                <div className="relative w-full overflow-hidden rounded-lg border">
                  <img src={preview} alt="Preview" className="aspect-[4/3] w-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => update('image_url', null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-sm text-muted-foreground hover:bg-muted/50">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <ImagePlus className="h-6 w-6" />
                  )}
                  {uploading ? 'Uploading…' : 'Click to upload an image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFile}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Farm location (optional)</Label>
              <LocationPicker
                value={{ latitude: form.latitude, longitude: form.longitude }}
                onChange={({ latitude, longitude }) =>
                  setForm((prev) => ({ ...prev, latitude, longitude }))
                }
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Save changes' : 'Publish listing'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
