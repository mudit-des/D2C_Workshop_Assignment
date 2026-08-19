import { useState, type ReactNode, type FormEvent } from "react";
import { Typography } from "@acko/typography";
import { Button } from "@acko/button";
import { Card } from "@acko/card";
import { Badge } from "@acko/badge";
import { TextInput } from "@acko/text-input";
import { Avatar } from "@acko/avatar";
import { Separator } from "@acko/separator";
import {
  ArrowLeft,
  Car,
  Coverage,
  CalendarDays,
  DiscountOfferSave,
  Discount,
  Money,
  ChevronDown,
} from "@acko/icons";

/**
 * Review policy screen — Figma node 10149:36245
 *
 * Card mapping (cards.md):
 * - Car / Coverage / Policy start → §1 PolicyCard (compact / standard)
 * - Apply coupon → §8 CommerceCard (coupon-input)
 * - Premium break-up → §8 CommerceCard (pricing-summary)
 */

const COUPONS = [
  {
    id: "flat-500",
    title: "₹500 off",
    description: "Available for the selected plan",
  },
  {
    id: "welcome-100",
    title: "WELCOME100 | ₹500 off",
    description: "Available for the selected plan",
  },
] as const;

const PREMIUM_ROWS = [
  { label: "Net premium", amount: "₹12,000" },
  { label: "18% GST", amount: "₹2,160" },
] as const;

const TOTAL_PREMIUM = "₹14,160";

function Icon24({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex size-24 shrink-0 [&_svg]:size-full"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function Icon32({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex size-32 shrink-0 [&_svg]:size-full"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** §1 PolicyCard — review section shell on primary page surface */
function PolicyReviewCard({
  icon,
  title,
  showChevron = true,
  trailing,
  children,
}: {
  icon: ReactNode;
  title: string;
  showChevron?: boolean;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card variant="primary" className="w-full overflow-hidden">
      <div className="review-card-strip flex items-center justify-between gap-12 px-16 pt-16 pb-12">
        <div className="flex items-center gap-8 min-w-0">
          {icon}
          <Typography variant="label-lg" color="primary">
            {title}
          </Typography>
        </div>
        {trailing ??
          (showChevron ? (
            <Icon24>
              <ChevronDown />
            </Icon24>
          ) : null)}
      </div>
      <div className="flex flex-col gap-12 px-16 pt-12 pb-16">
        {children}
      </div>
    </Card>
  );
}

/** §8 CommerceCard — coupon-input + offer list */
function CouponCommerceCard({
  couponCode,
  onCouponChange,
  onApplyCode,
}: {
  couponCode: string;
  onCouponChange: (value: string) => void;
  onApplyCode: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const canApply = couponCode.trim().length > 0;

  return (
    <Card variant="primary" className="w-full overflow-hidden">
      <div className="review-card-strip flex items-center justify-between gap-12 px-16 pt-16 pb-12">
        <div className="flex items-center gap-8 min-w-0">
          <Icon24>
            <DiscountOfferSave />
          </Icon24>
          <Typography variant="label-lg" color="primary">
            Apply coupon
          </Typography>
        </div>
        <Badge variant="solid" color="green" size="sm" textCase="sentence">
          2 coupons
        </Badge>
      </div>

      <div className="flex flex-col gap-24 px-16 pt-12 pb-16">
        <form className="w-full" onSubmit={onApplyCode}>
          <TextInput
            label="Coupon code"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => onCouponChange(e.target.value)}
            size="md"
            autoComplete="off"
            spellCheck={false}
            suffix={
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                disabled={!canApply}
              >
                Apply
              </Button>
            }
          />
        </form>

        <div className="flex flex-col gap-16 w-full">
          {COUPONS.map((coupon, index) => (
            <div key={coupon.id} className="flex flex-col gap-16">
              <div className="flex items-center gap-8 w-full">
                <Icon32>
                  <Discount />
                </Icon32>
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-12">
                    <Typography
                      variant="label-lg"
                      color="primary"
                      className="flex-1"
                    >
                      {coupon.title}
                    </Typography>
                    <Button variant="link" size="sm" type="button">
                      Apply
                    </Button>
                  </div>
                  <Typography variant="caption" color="secondary">
                    {coupon.description}
                  </Typography>
                </div>
              </div>
              {index < COUPONS.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/** §8 CommerceCard — pricing-summary */
function PremiumBreakupCard() {
  return (
    <Card variant="primary" className="w-full overflow-hidden">
      <div className="review-card-strip flex items-center justify-between gap-12 px-16 pt-16 pb-12">
        <div className="flex items-center gap-8 min-w-0">
          <Icon24>
            <Money />
          </Icon24>
          <Typography variant="label-lg" color="primary">
            Premium break-up
          </Typography>
        </div>
        <Icon24>
          <ChevronDown />
        </Icon24>
      </div>

      <div className="flex flex-col gap-16 px-16 pt-12 pb-16">
        <div className="flex flex-col gap-12 w-full">
          {PREMIUM_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-16 w-full"
            >
              <Typography variant="body-sm" color="secondary">
                {row.label}
              </Typography>
              <Typography variant="body-sm" color="secondary">
                {row.amount}
              </Typography>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-16 w-full">
          <Typography variant="body-md" weight="semibold">
            Total
          </Typography>
          <Typography variant="body-md" weight="semibold">
            {TOTAL_PREMIUM}
          </Typography>
        </div>
      </div>
    </Card>
  );
}

export default function ReviewScreen() {
  const [couponCode, setCouponCode] = useState("");

  const handleApplyCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[var(--surfaceBase)]">
      {/* Mobile purchase-flow frame — content capped; hero wash is full-bleed */}
      <div className="relative mx-auto w-full max-w-[360px] min-h-screen flex flex-col bg-[var(--surfaceBase)]">
        {/* Figma mWeb hero BG — soft pink/lavender glow (exported asset) */}
        <div className="review-hero-wash" aria-hidden="true">
          <img
            className="review-hero-wash__image"
            src="/assets/mweb-hero-bg.svg"
            alt=""
            width={359}
            height={207}
          />
          <div className="review-hero-wash__fade" />
        </div>

        {/* Transparent sticky chrome so hero glow remains visible */}
        <header className="review-top-chrome sticky top-0 z-[var(--zSticky)]">
          <div className="flex flex-col gap-20 pt-12">
            <div className="section-container flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                iconLeft={<ArrowLeft />}
                aria-label="Go back"
                type="button"
              >
                Back
              </Button>

              <div className="flex items-center gap-12 min-w-0">
                <Avatar
                  src="/assets/avatar-aparna.png"
                  alt="Aparna"
                  initials="A"
                  gender="female"
                  size="32"
                  status="online"
                />
                {/* Figma: Bold 14/20 */}
                <Typography variant="label-lg" weight="bold" color="primary">
                  Aparna
                </Typography>
              </div>
            </div>

            {/* Journey progress — near-complete final step */}
            <div
              className="journey-progress"
              role="progressbar"
              aria-valuenow={94}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Purchase progress"
            >
              <div className="journey-progress__fill" />
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 section-container flex flex-col gap-16 pt-24 pb-120">
          {/* Figma: Semibold 24px — heading-lg */}
          <Typography variant="heading-lg" as="h1">
            All set! You can review your policy details and premium
          </Typography>

          <div className="flex flex-col gap-16">
            {/* §1 PolicyCard — vehicle + owner */}
            <PolicyReviewCard
              icon={
                <Icon24>
                  <Car />
                </Icon24>
              }
              title="Car and personal details"
            >
              <div className="flex flex-col gap-4">
                {/* Figma: Medium 14px Neutral/N500 */}
                <Typography variant="label-lg" color="secondary">
                  MH 04 EQ 4392
                </Typography>
                {/* Figma: Regular 14px secondary */}
                <Typography variant="body-sm" color="secondary">
                  Maruti Swift Dzire • Petrol • 2010
                </Typography>
              </div>
            </PolicyReviewCard>

            {/* §1 PolicyCard — coverage summary */}
            <PolicyReviewCard
              icon={
                <Icon24>
                  <Coverage />
                </Icon24>
              }
              title="Coverage details"
            >
              <Typography variant="body-sm" color="primary">
                Zero depreciation Platinum plan (₹8.5 lakh IDV) with 3 additional
                covers
              </Typography>
            </PolicyReviewCard>

            {/* §1 PolicyCard — start date */}
            <PolicyReviewCard
              icon={
                <Icon24>
                  <CalendarDays />
                </Icon24>
              }
              title="Policy start date"
              showChevron={false}
            >
              <Typography variant="body-sm" color="secondary">
                Starts on{" "}
                <Typography variant="label-lg" color="primary" as="span">
                  24 May 2024
                </Typography>{" "}
                at 12 AM
              </Typography>
            </PolicyReviewCard>

            <CouponCommerceCard
              couponCode={couponCode}
              onCouponChange={setCouponCode}
              onApplyCode={handleApplyCoupon}
            />

            <PremiumBreakupCard />
          </div>
        </main>

        {/* Sticky pay CTA — safe-area aware (ui-polish.md / touch-accessibility) */}
        <div className="bottom-cta sticky bottom-0 z-[var(--zSticky)] w-full bg-[var(--cardFillDefault)] px-20 pt-12">
          <Button
            variant="inverted"
            size="md"
            fullWidth
            type="button"
          >
            Pay {TOTAL_PREMIUM}
          </Button>
        </div>
      </div>
    </div>
  );
}
