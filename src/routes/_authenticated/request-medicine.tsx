import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser } from "@/components/clerk-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Pill,
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  X,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { sendAdminNewOrderEmail } from "@/lib/email.server";

export const Route = createFileRoute("/_authenticated/request-medicine")({
  head: () => ({ meta: [{ title: "Order Medicines — Taj Medicals" }] }),
  component: RequestMedicinePage,
});

interface SelectedItem {
  id?: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
  isCustom: boolean;
}

function RequestMedicinePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const existing = selectedItems.find(
      (item) => item.name.toLowerCase() === customName.trim().toLowerCase(),
    );
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.name.toLowerCase() === customName.trim().toLowerCase()
            ? { ...item, quantity: item.quantity + customQty }
            : item,
        ),
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          name: customName.trim(),
          quantity: customQty,
          isCustom: true,
        },
      ]);
    }

    setCustomName("");
    setCustomQty(1);
    toast.success(`"${customName}" added to request`);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, val: number) => {
    if (val < 1) return;
    setSelectedItems(
      selectedItems.map((item, i) => (i === index ? { ...item, quantity: val } : item)),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0 && !prescriptionFile) {
      toast.error("Please add at least one medicine or upload a prescription.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to order.");
      return;
    }

    setSubmitting(true);

    try {
      const extraDetails = localStorage.getItem(`taj_profile_${user.id}`);
      let phone = "";
      let address = "";
      if (extraDetails) {
        const parsed = JSON.parse(extraDetails);
        phone = parsed.phone || "";
        address = parsed.address || "";
      }

      let prescriptionUrl = null;
      if (prescriptionFile) {
        const fileExt = prescriptionFile.name.split(".").pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("prescriptions")
          .upload(fileName, prescriptionFile);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("prescriptions").getPublicUrl(fileName);
        prescriptionUrl = publicUrl;
      }

      const estimatedTotal = 0.0;

      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          user_email: user.primaryEmailAddress.emailAddress,
          user_phone: phone,
          user_address: address,
          items: selectedItems as any,
          prescription_url: prescriptionUrl,
          status: "pending_review",
          total_price: estimatedTotal,
          payment_status: "unpaid",
          notes: notes,
        })
        .select()
        .single();

      if (error) throw error;

      try {
        await sendAdminNewOrderEmail({
          data: {
            orderId: data.id,
            customerEmail: user.primaryEmailAddress.emailAddress,
            notes: notes,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send admin notification email", emailErr);
      }

      toast.success("Order request submitted successfully!");
      navigate({ to: "/my-orders" });
    } catch (err) {
      console.error("Order submission failed", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/20">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-emerald-800 hover:bg-emerald-50 rounded-xl"
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" /> Order Medicines
          </h1>
          <p className="mt-1.5 text-emerald-900/70">
            Upload your doctor's prescription slip, list the medicines you need packaged, and our
            pharmacist will set it up for pickup.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">
                  1
                </span>
                Upload Prescription Photo
              </h2>
              <p className="text-xs text-emerald-900/60 mb-4">
                Please upload a photo of your doctor's slip as a proof to verify prescribed
                medications.
              </p>

              {prescriptionPreview ? (
                <div className="relative border border-emerald-100 rounded-2xl bg-emerald-50/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-lg overflow-hidden border border-emerald-100 bg-white flex items-center justify-center">
                      <img
                        src={prescriptionPreview}
                        alt="Prescription"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-950 truncate max-w-[200px]">
                        {prescriptionFile?.name}
                      </p>
                      <p className="text-[10px] text-emerald-950/50">
                        {(prescriptionFile!.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-emerald-900/50 hover:text-red-500"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-emerald-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50/30 transition group">
                  <UploadCloud className="h-8 w-8 text-emerald-900/40 group-hover:text-emerald-600 transition mb-2" />
                  <span className="text-sm font-semibold text-emerald-950">
                    Click to upload prescription
                  </span>
                  <span className="text-[10px] text-emerald-900/50 mt-0.5">
                    Supports PNG, JPG, PDF up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">
                  2
                </span>
                Specify Medicines to Pack
              </h2>
              <p className="text-xs text-emerald-900/60 mb-4">
                Type the names and quantities of the medicines you want our team to package.
              </p>

              <form onSubmit={handleAddCustomItem} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter medicine name (e.g. Paracetamol 650mg)"
                    className="h-11 border-emerald-100 rounded-xl focus-visible:ring-emerald-500"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-28 flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="h-11 border-emerald-100 rounded-xl text-center focus-visible:ring-emerald-500"
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                  />
                  <Button
                    type="submit"
                    className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 sticky top-24">
              <h2 className="text-xl font-extrabold text-emerald-950 border-b border-emerald-50 pb-4 mb-4">
                Medicines List
              </h2>

              {selectedItems.length === 0 ? (
                <div className="py-12 text-center text-emerald-900/40">
                  <Pill className="h-10 w-10 mx-auto text-emerald-900/20 mb-2" />
                  <p className="text-sm font-semibold">No medicines specified yet</p>
                  <p className="text-xs mt-0.5">Use the specify tool on the left to add items.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 mb-6">
                  {selectedItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-emerald-50/50 last:border-b-0 last:bg-transparent"
                    >
                      <div>
                        <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                          {item.name}
                        </p>
                        <p className="text-xs text-emerald-950/50">
                          Price set by pharmacist on packaging
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-emerald-100 bg-emerald-50/20">
                          <button
                            className="px-2 py-1 text-emerald-800 font-bold hover:bg-emerald-50 transition text-sm"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-emerald-950">
                            {item.quantity}
                          </span>
                          <button
                            className="px-2 py-1 text-emerald-800 font-bold hover:bg-emerald-50 transition text-sm"
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-900/50 hover:text-red-500 rounded-lg"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 mb-6">
                <Label htmlFor="notes" className="text-xs font-bold text-emerald-950">
                  Special Instructions
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Specify chronic history, allergies, dosage preferences, or general notes."
                  className="min-h-[80px] border-emerald-100 rounded-xl focus-visible:ring-emerald-500 text-xs"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-3.5">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (selectedItems.length === 0 && !prescriptionFile)}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Sparkles className="h-4.5 w-4.5 animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Submit to Pharmacist
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-emerald-800 hover:bg-emerald-50 rounded-xl"
                >
                  <Link to="/my-orders">View Active Requests</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
