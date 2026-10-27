import { memberInk } from "@/lib/memberInk";

interface AvatarProps {
  name: string;
  size?: number;
}

export default function Avatar({ name, size = 36 }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-on-ink"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: memberInk(name),
      }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
