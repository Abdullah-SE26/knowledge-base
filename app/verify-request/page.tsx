export default function VerifyRequestPage() {

  return (
    <div className="min-h-screen flex items-center justify-center text-center flex-col ">
      <h2 className="text-2xl text-black font-semibold mb-4 dark:text-gray-700">📩 Check your email</h2>
      <p className="text-gray-700 max-w-md">
        A sign-in link has been sent to your email. Click the button in that email to verify your identity and access the resources. <br/>
        <span className='font-semibold'>Dont see an Email? Check your All Mail and Spam.</span> 
      </p>
      
    </div>
  );
}
