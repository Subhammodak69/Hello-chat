import React, { useState, useEffect } from 'react'
import avatar_icon from '../assets/avatar.avif';
import arrow_icon from '../assets/left-arrow.png';
import assets from '../assets/assets';

// Custom hook: define outside main component
function useIsMobile(breakpoint = 786) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

const RightSidebar = ({ selectedUserData, isOnProfile, setIsOnProfile }) => {
  const isMobile = useIsMobile();

  // When to show sidebar
  const shouldShowSidebar =
    (isMobile && isOnProfile) || (!isMobile && selectedUserData);

  if (!shouldShowSidebar) return null;

  return (
    <div className="bg-[#00ffe0]/10 text-white w-full relative overflow-y-scroll md:block ">
      {/* Back arrow for mobile */}
      <img
        onClick={() => setIsOnProfile(false)}
        src={arrow_icon}
        alt=""
        className="md:hidden absolute top-[10px] right-[10px] max-w-7 cursor-pointer"
      />

      {/* User profile */}
      <div className="pt-10 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        <img
          src={selectedUserData? selectedUserData.profilePic : avatar_icon}
          alt=""
          className="w-20 aspect-[1/1] rounded-full"
        />
        <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {selectedUserData?.fullName}
        </h1>
        <p className="px-10 mx-auto">{selectedUserData?.bio}</p>
      </div>

      <hr className="border-[#ffffff70] my-4" />
      <p className="flex justify-center p-[10px]">Media</p>

      {/* Media images grid */}
      <div className="px-5 text-xs overflow-y-scroll max-h-[60%]">
        <div className="mt-2 grid grid-cols-2 gap-4">
          {assets.imagesDummyData.map(({ url }, index) => (
            <div
              key={index}
              onClick={() => window.open(url)}
              className="cursor-pointer rounded"
            >
              <img src={url} alt="" className="h-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
