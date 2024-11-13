import Image from "next/image";

const Logo = () => {
  return (
    <>
      <div className="flex items-center">
        <Image
          src="/images/logo/small-budget.png"
          alt="SmallBudget Logo"
          width={80}
          height={80}
          className="mb-2"
          />
        <div className="flex flex-col items-start">
          <h3 className="text-2xl font-bold text-slate-950">Small Budget</h3>
          <h3 className="text-lg text-lime-700 hidden md:block">Budgeting made small and simple.</h3>
      </div>
      </div>
    </>
  );
};

export default Logo; 