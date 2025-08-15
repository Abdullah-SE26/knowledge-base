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
        <AccordionTrigger>
          How do I search for articles in the Knowledge Base? / كيف أقوم بالبحث عن المقالات في قاعدة المعرفة؟
        </AccordionTrigger>
        <AccordionContent>
          <p>
            Use the search bar at the top of the page to enter keywords related to your issue.
            You can filter results by categories or tags to find relevant articles faster.
          </p>
          <p className="mt-2">
            استخدم شريط البحث في أعلى الصفحة لإدخال الكلمات المفتاحية المتعلقة بمشكلتك.
            يمكنك تصفية النتائج حسب الفئات أو العلامات للعثور على المقالات ذات الصلة بشكل أسرع.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger>
          Why can&apos;t I see certain articles or content? / لماذا لا أستطيع رؤية بعض المقالات أو المحتوى؟
        </AccordionTrigger>
        <AccordionContent>
          <p>
            Some articles may be restricted based on your user role or permissions.
            If you believe you should have access, please contact your system administrator.
          </p>
          <p className="mt-2">
            قد تكون بعض المقالات مقيدة بناءً على دور المستخدم أو الأذونات الخاصة بك.
            إذا كنت تعتقد أنه يجب أن يكون لديك حق الوصول، يرجى الاتصال بمسؤول النظام الخاص بك.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger>
          How often is the Knowledge Base updated? / كم مرة يتم تحديث قاعدة المعرفة؟
        </AccordionTrigger>
        <AccordionContent>
          <p>
            Our admins update the Knowledge Base regularly to ensure the information is current.
            If you notice outdated or missing information, please notify the IT Help Desk.
          </p>
          <p className="mt-2">
            يقوم المسؤولون لدينا بتحديث قاعدة المعرفة بانتظام لضمان أن المعلومات حديثة.
            إذا لاحظت معلومات قديمة أو مفقودة، يرجى إعلام مكتب الدعم الفني.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger>
          What should I do if I can&apos;t find a solution to my problem? / ماذا يجب أن أفعل إذا لم أجد حلاً لمشكلتي؟
        </AccordionTrigger>
        <AccordionContent>
          <p>
            If you can&apos;t find the answer you&apos;re looking for, you can{" "}
            <a
              href="https://helpdesk.mawaridhi.com/support/home"
              target="_blank"
              className="text-blue-600 underline"
            >
              visit the IT Help Desk
            </a>{" "}
            to create a support ticket and get personalized assistance.
          </p>
          <p className="mt-2">
            إذا لم تتمكن من العثور على الإجابة التي تبحث عنها، يمكنك{" "}
            <a
              href="https://helpdesk.mawaridhi.com/support/home"
              target="_blank"
              className="text-blue-600 underline"
            >
              زيارة مكتب الدعم الفني
            </a>{" "}
            لإنشاء تذكرة دعم والحصول على المساعدة الشخصية.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-5">
        <AccordionTrigger>
          Why didn&apos;t I receive an email? / لماذا لم أستلم البريد الإلكتروني؟
        </AccordionTrigger>
        <AccordionContent>
          <p>
            If you are registering for the first time, the verification email may take some time to deliver, please wait for some time. <br/>
            If you still don&apos;t see an email, please check the Spam or All Mail sections of your application. <br/>
            Re-check your entered email, only company-registered emails are allowed.
          </p>
          <p className="mt-2">
            إذا كنت تقوم بالتسجيل لأول مرة، قد يستغرق وصول البريد الإلكتروني للتحقق بعض الوقت، يرجى الانتظار قليلاً. <br/>
            إذا لم يصلك البريد الإلكتروني بعد، يرجى التحقق من قسم الرسائل غير المرغوب فيها أو جميع الرسائل في تطبيقك. <br/>
            تحقق مرة أخرى من البريد الإلكتروني الذي أدخلته، مسموح فقط بالبريد الإلكتروني المسجل في الشركة.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default FaqAccordion;
