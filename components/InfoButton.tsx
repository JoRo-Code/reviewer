import { HiOutlineInformationCircle } from "react-icons/hi2";
import React from 'react';
import { isMobile } from 'react-device-detect';


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const InfoButton: React.FC = () => {


  const description = `
    Here you'll get feedback on your text.
    
    The feedback will be provided both as a list of comments and highlighted areas of the original text, with different colors depending on the type of comment.
    Hover on the highlights to get additional comments (not supported for mobile).

    Hit the button to start!
  
  `
  {
    return (
    isMobile ?
    <button>
        <HiOutlineInformationCircle className="text-2xl transform hover:scale-125 transition-all duration-200" onClick={() => alert(description)}/>
    </button>
      : (
        <LaptopInfoButton description={description} />
      ))
  }
}



interface LaptopInfoButtonProps {
  description: string;
}

const LaptopInfoButton: React.FC<LaptopInfoButtonProps> = ({ description }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-2xl transform hover:scale-125 transition-all duration-200">
          <HiOutlineInformationCircle />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className='scale-125'>
        <AlertDialogHeader>
          <AlertDialogTitle>Dear guest!</AlertDialogTitle>
          <AlertDialogDescription className='text-grey-300'>
            {description}
          </AlertDialogDescription >
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Thanks</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LaptopInfoButton;


