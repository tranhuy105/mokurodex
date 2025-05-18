// "use client";

// import { useEffect, useState } from "react";

// /**
//  * A component that initializes the server data when mounted
//  * Should be included in the layout to ensure data is preloaded
//  */
// export default function ServerInitializer() {
//   const [initialized, setInitialized] = useState(false);

//   useEffect(() => {
//     // Only run once
//     if (initialized) return;

//     // Call the initialization API
//     fetch("/api/init-server")
//       .then((res) => res.json())
//       .then((data) => {
//         setInitialized(data.initialized);
//       })
//       .catch((error) => {
//         console.error("Failed to initialize server:", error);
//       });
//   }, [initialized]);

//   // This component doesn't render anything
//   return null;
// }
