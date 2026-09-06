// A simplified silhouette of the Gateway of India — chosen over a generic
// skyline because a plain row of building blocks didn't read as "Mumbai" to
// anyone; this arch-and-domed-turrets shape is the one Mumbai landmark most
// people actually recognize.
export default function MumbaiSkyline({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="51" cy="34" r="8" />
        <rect x="45" y="34" width="12" height="46" />
        <circle cx="66" cy="24" r="7" />
        <rect x="60" y="24" width="12" height="56" />
        <circle cx="134" cy="24" r="7" />
        <rect x="128" y="24" width="12" height="56" />
        <circle cx="149" cy="34" r="8" />
        <rect x="143" y="34" width="12" height="46" />
        <circle cx="100" cy="20" r="10" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M74 20h52v60H74zM94 80V50a6 6 0 0 1 12 0v30Z"
        />
        <rect x="18" y="80" width="164" height="10" />
      </g>
    </svg>
  )
}
