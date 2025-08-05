import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqAccordion = () => {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>How do I search for articles in the Knowledge Base?</AccordionTrigger>
        <AccordionContent>
          Use the search bar at the top of the page to enter keywords related to your issue.
          You can filter results by categories or tags to find relevant articles faster.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger>Why can&apos;t I see certain articles or content?</AccordionTrigger>
        <AccordionContent>
          Some articles may be restricted based on your user role or permissions.
          If you believe you should have access, please contact your system administrator.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger>How often is the Knowledge Base updated?</AccordionTrigger>
        <AccordionContent>
          Our admins update the Knowledge Base regularly to ensure the information is current.
          If you notice outdated or missing information, please notify the IT Help Desk.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger>What should I do if I can&apos;t find a solution to my problem?</AccordionTrigger>
        <AccordionContent>
          If you can&apos;t find the answer you&apos;re looking for, you can{" "}
          <a href="https://helpdesk.mawaridhi.com/support/home" className="text-blue-600 underline">
            visit the IT Help Desk
          </a>{" "}
          to create a support ticket and get personalized assistance.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-5">
        <AccordionTrigger>Why I didnt receive an email?</AccordionTrigger>
        <AccordionContent>
          If you are registering for the first time, the verification email may take some time to deliver, please wait for some time. <br/>
          If you still dont see an email please check the Spam or the All Mail sections of your application. <br/>
          Re-check your entered email, only company registered emails are allowed.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default FaqAccordion;
